import Vuex from "vuex";
// import axios from "axios";
import Cookie from "js-cookie";

const createStore = () => {
  return new Vuex.Store({
    state: {
      recipes: [],
      token: null,
      userData: null,
    },
    getters: {
      recipeData(state) {
        return state.recipes;
      },
      lastIdRecipe(state) {
        let recipesLength = state.recipes.length;
        return state.recipes[recipesLength - 1].id;
      },
      detailRecipe: (state) => (id) => {
        return state.recipes.find((recipe) => recipe.id === id);
      },
      isAuthenticated(state) {
        return state.token != null;
      },
      userId(state) {
        return state.userData.userId;
      },
      userEmail(state) {
        if (state.userData === null) {
          return;
        }
        return state.userData.email;
      },
    },
    mutations: {
      addNewRecipe(state, payload) {
        return state.recipes.push(payload);
      },
      setRecipe(state, payload) {
        state.recipes = payload;
      },
      setToken(state, payload) {
        state.token = payload;
      },
      setUserData(state, payload) {
        state.userData = payload;
      },
      deleteRecipe(state, payload) {
        const recipes = state.recipes.filter((item) => item.id !== payload);
        state.recipes = recipes;
      },
    },
    actions: {
      nuxtServerInit({ commit }, {app}) {
        return app.$axios
          .get(
            "/datarecipe.json"
          )
          .then((response) => {
            const recipeArray = [];
            console.log(response)
            for (const key in response.data) {
              recipeArray.push({ ...response.data[key], id: key });
            }
            commit("setRecipe", recipeArray);
          })
          .catch((e) => context.error(e));
      },
      getRecipe({ commit }) {
        return this.$axios
          .$get(
            "/datarecipe.json"
          )
          .then((response) => {
            const recipeArray = [];
            console.log(response)
            for (const key in response) {
              recipeArray.push({ ...response[key], id: key });
            }
            commit("setRecipe", recipeArray);
          })
          .catch((e) => context.error(e));
      },
      addRecipe({ commit, state }, recipe) {
        return this.$axios
          .$post(
            "/datarecipe.json?auth=" +
              state.token,
            {
              ...recipe,
              userId: state.userData.userId,
              username: state.userData.username,
              dataLikes: ["null"],
            }
          )
          .then((response) => {
            console.log(response)
            commit("addNewRecipe", {
              ...recipe,
              dataLikes: ["null"],
              userId: state.userData.userId,
              username: state.userData.username,
              id: response.name,
            });
          });
      },
      likeUpdate({ commit, state, dispatch }, recipe) {
        return this.$axios
          .$put(
            "/datarecipe/" +
              recipe.recipeId +
              ".json?auth=" +
              state.token,
            recipe.newDataRecipe
          )
          .then((res) => dispatch("getRecipe"));
      },
      authenticateUser({ commit, state }, authData) {
        console.log("login")
        let webAPIKey = "AIzaSyAij0oArB2ZrBoXdtlJpO-nz1-MYiQ3Bmw";
        let authUrl = authData.isLogin
          ? "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key="
          : "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=";

        return this.$axios
          .$post(authUrl + webAPIKey, {
            email: authData.email,
            password: authData.password,
            returnSecureToken: true,
            displayName: authData.displayName,
          })
          .then((response) => {
            console.log(response);
            commit("setToken", response.idToken);
            commit("setUserData", {
              username: response.displayName,
              userId: response.localId,
              email: response.email,
            });

            // Menyimpan Token pada local storage dan cookies
            localStorage.setItem("token", response.idToken);
            Cookie.set("jwt", response.idToken);

            // Menyimpan data expires pada local storage dan cookie
            localStorage.setItem(
              "tokenExpiration",
              new Date().getTime() +
                Number.parseInt(response.expiresIn) * 1000
            );
            Cookie.set(
              "expirationDate",
              new Date().getTime() +
                Number.parseInt(response.expiresIn) * 1000
            );

            const userData = {
              username: response.displayName,
              userId: response.localId,
              email: response.email,
            };

            localStorage.setItem("user", JSON.stringify(userData));
            Cookie.set("acc_user", JSON.stringify(userData));
          })
          .catch((error) => console.log(error));
      },
      initAuth({ commit, dispatch }, req) {
        let token;
        let user;
        let expirationDate;
        // Apabila req tidak bernilai undifined (Halaman web dijalankan pada sisi server)
        if (req) {
          // Apabila tidak ada cookie yang ditemukan
          if (!req.headers.cookie) {
            return;
          }

          // Code ini digunakan untuk mengambil cookie bernama jwt
          const jwtCookie = req.headers.cookie
            .split(";")
            .find((c) => c.trim().startsWith("jwt="));

          // Get User Cookie
          const accUserCookie = req.headers.cookie
            .split(";")
            .find((c) => c.trim().startsWith("acc_user="));

          // Mengambil data user dari cookie
          const userCookie = accUserCookie.substr(
            accUserCookie.indexOf("=") + 1
          );
          // Data yang diperoleh dalam bentuk JSON, maka harus diubah menjadi object
          user = JSON.parse(decodeURIComponent(userCookie));

          // Jika tidak ditemukan cookie yang diperlukan
          if (!jwtCookie) {
            return;
          }

          // Mengambil data token dari cookie
          token = jwtCookie.split("=")[1];

          // Mengambil data expires dari cookie
          expirationDate = req.headers.cookie
            .split(";")
            .find((c) => c.trim().startsWith("expirationDate="))
            .split("=")[1];

          // Apabila halaman web dijalankan dari sisi client
        } else {
          token = localStorage.getItem("token");
          user = JSON.parse(localStorage.getItem("user"));
          expirationDate = localStorage.getItem("tokenExpiration");
        }

        // Tanda plus digunakan untuk mengubah kedalam bentuk number
        if (new Date().getTime() > +expirationDate || !token) {
          console.log("No token or invalid token");
          dispatch("logout");
          return;
        }

        commit("setToken", token);
        commit("setUserData", user);
      },
      logout({ commit }) {
        commit("setToken", null);
        Cookie.remove("jwt");
        Cookie.remove("acc_user");
        Cookie.remove("expirationDate");
        if (process.client) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("tokenExpiration");
        }
      },
      deleteRecipe({ commit, state }, recipeId) {
        return this.$axios
          .$delete(
            "/datarecipe/" +
              recipeId +
              ".json?auth=" +
              state.token
          )
          .then((res) => commit("deleteRecipe", recipeId));
      },
      updateRecipe({ dispatch, state }, recipe) {
        return this.$axios.$put(
          "/datarecipe/" +
            recipe.id +
            ".json?auth=" +
            state.token,
            recipe.newRecipe
        ).then((res) => dispatch("getRecipe"));
      },
    },
  });
};
export default createStore;
