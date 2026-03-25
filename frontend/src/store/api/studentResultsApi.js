import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ACCESS_KEY = "accessToken";

export const studentResultsApi = createApi({
  reducerPath: "studentResultsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://autogen.aieducator.com",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem(ACCESS_KEY);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getStudentResults: builder.query({
      query: () => "/student-results/",
      keepUnusedDataFor: 300, // cache for 5 minutes
    }),
  }),
});

export const { useGetStudentResultsQuery } = studentResultsApi;
