<template>
  <div>
    <app-recipe-list :dataRecipes="recipes" :isUser="true"></app-recipe-list>
  </div>
</template>
<script>
import RecipeList from "../../components/recipe/RecipeList.vue";
export default {
  middleware: ["check-auth", "auth"],
  // data() {
  //   return {
  //     recipes: [],
  //   };
  // },
  computed: {
    recipes() {
      const userId = this.$store.getters.userId;
      const recipes = this.$store.getters.recipeData;
      console.log(recipes)
      return recipes.filter((recipe) => recipe.userId == userId);
    },
  },
  // async mounted() {
  //   await this.$store.dispatch("getRecipe");
  //   const userId = this.$store.getters.userId;
  //   const dataRecipes = this.$store.getters.recipeData;
  //   this.recipes = dataRecipes.filter((recipe) => recipe.userId == userId);
  // },
  components: {
    "app-recipe-list": RecipeList,
  },
};
</script>