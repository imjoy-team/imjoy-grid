<template>
  <div class="home">
    <GridWindow msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
// @ is an alias to /src
import GridWindow from "@/components/GridWindow.vue";

export default {
  name: "Home",
  components: {
    GridWindow
  }
};
</script>
