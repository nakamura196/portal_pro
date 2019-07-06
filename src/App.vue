<template>
    <v-app>
        <v-toolbar>
            <v-toolbar-title class="headline">
                UTokyo Digital Archives Project Pro
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
                <v-btn flat>
                    <a href="https://github.com/nakamura196/portal_pro"><i class="material-icons">home</i></a>
                </v-btn>
            </v-toolbar-items>
        </v-toolbar>
    
        <v-content>
            <router-view/>
        </v-content>
    
        <v-footer dark height="auto">
            <v-card class="flex" flat tile>
    
                <v-card-actions class="grey darken-3 justify-center my-5 text-xs-center">
                    東京大学学術資産等アーカイブズ委員会事務局<br/> （東京大学附属図書館総務課／学術資産アーカイブ化推進室）
                    <br/> E-mail：digital-archive [at] lib.u-tokyo.ac.jp.
                </v-card-actions>
            </v-card>
        </v-footer>
    </v-app>
</template>
