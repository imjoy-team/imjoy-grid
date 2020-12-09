import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import { store } from "./store";
import VueMaterial from "vue-material";
import "vue-material/dist/vue-material.min.css";
import "vue-material/dist/theme/default.css";
import VueGridLayout from "vue-grid-layout";
Vue.component("grid-layout", VueGridLayout.GridLayout);
Vue.component("grid-item", VueGridLayout.GridItem);

Vue.config.productionTip = false;

Vue.use(VueMaterial);

new Vue({
  router,
  render: h => h(App),
  store
}).$mount("#app");
