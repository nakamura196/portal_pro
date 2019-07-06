<template>
    <v-app>
        <v-content>
            <v-container class="my-2">

                <h1 class="mb-4">ポスター検索</h1>

                <v-layout row wrap>
                        <v-flex xs12 sm2  v-for="item in items" class="px-4 my-4">
                        <a :href="item.seeAlso.value" target="_blank">
                            <v-img :src="item.thumbnail.value"></v-img>
                            </a>
                            <div class="subheading pt-3"><a :href="item.seeAlso.value" target="_blank">{{item.title.value}}</a><br/>{{item.publisher.value}}</div>
                        </v-flex>
                        </v-layout>

                
    </v-container>
        </v-content>
    </v-app>
</template>

<script>
import FullCalendar from '@fullcalendar/vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import axios from 'axios';

// str: 日付文字列（yyyy-MM-dd, yyyy/MM/dd）
// delim: 区切り文字（"-", "/"など）
function isDate(str, delim) {
    var arr = str.split(delim);
    if (arr.length !== 3) return false;
    const date = new Date(arr[0], arr[1] - 1, arr[2]);
    if (arr[0] !== String(date.getFullYear()) || arr[1] !== ('0' + (date.getMonth() + 1)).slice(-2) || arr[2] !== ('0' + date.getDate()).slice(-2)) {
        return false;
    } else {
        return true;
    }
};

function dateToYearAndMonth(date) {
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    month = month < 10 ? "0" + month : month

    return year + "-" + month
}

export default {
    components: {
        FullCalendar // make the <FullCalendar> tag available
    },
    data: function() {
        return {
            calendarPlugins: [ // plugins must be defined in the JS
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin // needed for dateClick
            ],
            calendarWeekends: true,
            calendarEvents: [],
            defaultDate: new Date("1918-01"),
            q: "",
            type: "",
            collection: "",
            date: "1918-01",
            collection: "",
            items: []
        }
    },
    watch: {
        '$route' (to, from) {
            this.search()
        }
    },
    created: function() {
        let param = Object.assign({}, this.$route.query)
        if (param.q) {
            this.q = param.q
        }
        if (param.type) {
            this.type = param.type
            //this.type_array = this.type.split(',');
        }
        if (param.collection) {
            this.collection = param.collection
            //this.type_array = this.type.split(',');
        }
        if (param.date) {
            this.defaultDate = new Date(param.date)
            this.date = dateToYearAndMonth(this.defaultDate)
        }
        this.search()
    },

    methods: {
        updatePath() {
            //this.type = this.type_array.join(',');
            this.defaultDate = new Date(this.date)
            this.$router.push({ path: "list", query: { q: this.q, type: this.type, date: this.date, collection: this.collection } })
        },
        search() {
            this.calendarEvents = []

            let query = " PREFIX dcterms: <http://purl.org/dc/terms/> \n";
            query += " PREFIX dcndl: <http://ndl.go.jp/dcndl/terms/> \n";
            query += " select distinct * \n";
            query += " WHERE { \n";
            query += " ?s dcterms:title ?title . \n";
            query += " ?s foaf:thumbnail ?thumbnail . \n";
            query += " { ?s dcterms:isPartOf \"第一次世界大戦期プロパガンダ・ポスター 益田コレクション\"@ja . }  \n";
            query += " UNION \n";
            query += " { ?s dcterms:isPartOf \"第一次世界大戦期プロパガンダポスターコレクション\"@ja . }  \n";
            query += " ?s dcndl:digitizedPublisher ?publisher . \n";
            query += " filter (lang(?publisher) = \"ja\") . \n";
            query += " ?s rdfs:seeAlso ?seeAlso . \n";
            query += " } order by ?title \n";

            axios.get("https://sparql.dl.itc.u-tokyo.ac.jp?query=" + encodeURIComponent(query) + "&output=json")
                .then(response => {

                    this.items = response.data.results.bindings
                    console.log(this.items)

                }).catch(error => { console.log(error); });
        }
    }
}
</script>

<style lang='scss'>
// you must include each plugins' css
// paths prefixed with ~ signify node_modules
@import '~@fullcalendar/core/main.css';
@import '~@fullcalendar/daygrid/main.css';
@import '~@fullcalendar/timegrid/main.css';
</style>