import { configureStore } from "@reduxjs/toolkit";
import { studentResultsApi } from "./api/studentResultsApi";
import { commerceApi } from "./api/commerceApi";

export const store = configureStore({
  reducer: {
    [studentResultsApi.reducerPath]: studentResultsApi.reducer,
    [commerceApi.reducerPath]: commerceApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(studentResultsApi.middleware)
      .concat(commerceApi.middleware),
});
