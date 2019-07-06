
<template>
    <v-app>
        <v-content>
            <v-container class="my-2">
                <v-form ref="form" class="mb-2">
                    <v-layout row wrap>
                        <v-flex xs12 sm4>
                            <v-text-field v-model="q" label="キーワード / Keyword" name="q" class="mx-2"></v-text-field>
                        </v-flex>
                        <v-flex xs12 sm4>
                            <v-select :items="types" label="資料種別 / Type" class="mx-2" multiple v-model="type_array"></v-select>
                        </v-flex>
                        <v-flex xs12 sm4>
                            <v-select :items="collections" label="コレクション / Collection" class="mx-2" multiple v-model="collection_array"></v-select>
                        </v-flex>
    
                    </v-layout>
    
                    <v-btn color="primary" @click="updatePath">
                        <i class="material-icons">search</i>
                    </v-btn>
    
                </v-form>
    
                <v-data-table :items="items" class="elevation-1 mt-5" hide-actions hide-headers>
                    <template v-slot:items="props">
                                                                <th>{{ props.item.year }}</th>
                                                                    <td class="text-xs-right" v-for="index in 12">
                                                                        <!-- <a :href="'list?q='+q+'&date=' + props.item.year + '-' + index + '&type=' + type" v-if="props.item.month[index-1] > 0">{{index}}月 ({{ props.item.month[index-1] }})</a> -->
                                                                        <router-link v-if="props.item.month[index-1] > 0" v-bind:to="{ path : 'list', query : { q: q, type: type, collection: collection, date: props.item.year + '-' + index }}">{{index}}月 ({{ props.item.month[index-1] }})</router-link>
                                                                        <span v-else>{{index}}月</span>
            
                                                                        
                                                            </td>
</template>
                </v-data-table>
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

export default {
    components: {
        FullCalendar // make the <FullCalendar> tag available
    },
    data: function() {
        return {
            items: [],
            q: "",
            type: "Newspaper",
            type_array: ["Newspaper"],
            types: [
                { value: "Newspaper", text: "新聞" },
                { value: "StillImage", text: "静止画資料" }
            ],
            collection: "",
            collection_array: [],
            collections: []
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
            this.type_array = this.type.split(',');
        }
        if (param.collection) {
            this.collection = param.collection
            this.collection_array = this.collection.split(',');
        }
        this.search()
        this.list_collections()
    },
    methods: {
        handleDateClick(arg) {
            window.open(arg.event.id, "_blank");
        },
        updatePath() {
            this.type = this.type_array.join(',');
            this.collection = this.collection_array.join(',');
            this.$router.push({ path: "", query: { q: this.q, type: this.type, collection: this.collection } })
        },
        list_collections(){
            let query = " PREFIX dcterms: <http://purl.org/dc/terms/> \n";
            query += " PREFIX dcndl: <http://ndl.go.jp/dcndl/terms/> \n";
            query += " select distinct ?collection \n";
            query += " WHERE { \n";
            query += " ?s dcterms:isPartOf ?collection . \n";
            query += " filter(lang(?collection) = \"ja\") . \n";
            query += " } order by desc(?collection) \n";

            console.log(query)

             axios.get("https://sparql.dl.itc.u-tokyo.ac.jp?query=" + encodeURIComponent(query) + "&output=json")
                .then(response => {

                    let result = response.data.results.bindings

                    for (let i = 0; i < result.length; i++) {
                        let obj = result[i];

                        let collection = obj.collection.value
                        this.collections.push(collection)
                    }

                }).catch(error => { console.log(error); });
        },
        search() {

            let query = " PREFIX dcterms: <http://purl.org/dc/terms/> \n";
            query += " PREFIX dcndl: <http://ndl.go.jp/dcndl/terms/> \n";
            query += " select distinct ?date count(distinct ?s) as ?c \n";
            query += " WHERE { \n";
            query += " ?s dcterms:date ?date . \n";
            if (this.type) {
                let type_array = this.type.split(",")
                for (let j = 0; j < type_array.length; j++) {
                    query += " { ?s dcndl:materialType <http://ndl.go.jp/ndltype/" + type_array[j] + "> . } \n";
                    if (j != type_array.length - 1) {
                        query += " UNION \n"
                    }
                }
            }
            if (this.collection) {
                let collection_array = this.collection.split(",")
                for (let j = 0; j < collection_array.length; j++) {
                    query += " { ?s dcterms:isPartOf '"+collection_array[j]+"'@ja . } \n";
                    if (j != collection_array.length - 1) {
                        query += " UNION \n"
                    }
                }
            }
            if (this.q) {
                query += " ?s ?p ?o . \n";
                query += " ?o bif:contains '\"" + this.q + "\"' . \n";
            }
            query += " } order by desc(?date) \n";

            console.log(query)

            axios.get("https://sparql.dl.itc.u-tokyo.ac.jp?query=" + encodeURIComponent(query) + "&output=json")
                .then(response => {

                    let result = response.data.results.bindings

                    let items = []
                    this.items = items

                    var min_year = 2000
                    var max_year = 0
                    var map = {}

                    for (let i = 0; i < result.length; i++) {
                        let obj = result[i];

                        let date = obj.date.value
                        let c = Number(obj.c.value)

                        if (isDate(date, '-')) {
                            let tmp = date.split("-")
                            let year = Number(tmp[0])

                            if (year < min_year) {
                                min_year = year
                            }

                            if (year > max_year) {
                                max_year = year
                            }

                            let month = Number(tmp[1])

                            if (!map[year]) {
                                map[year] = {}
                            }

                            let tmp2 = map[year]

                            if (!tmp2[month]) {
                                tmp2[month] = 0
                            }

                            tmp2[month] += c

                        }
                    }

                    for (let year = min_year; year <= max_year; year++) {
                        let obj = {
                            year: year,
                            month: []
                        }

                        let tmp = map[year]

                        for (let month = 1; month <= 12; month++) {
                            let value = tmp != null && tmp[month] ? tmp[month] : 0
                            obj.month.push(value)
                        }

                        items.push(obj)
                    }

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