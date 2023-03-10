<template>
  <app-recipe-form :recipes="dataRecipe"></app-recipe-form>
</template>

<script>
import RecipeForm from "../../../components/admin/RecipeForm.vue";
export default {
  middleware: ["check-auth", "auth", "check-user"],
  asyncData({ store, params }) {
    const recipe = store.getters.detailRecipe(params.recipeId);
    const dataRecipe = { ...recipe, id: params.recipeId };
    return { dataRecipe };
  },
  components: {
    "app-recipe-form": RecipeForm,
  },
};
</script>