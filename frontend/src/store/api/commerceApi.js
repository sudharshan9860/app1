import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ACCESS_KEY = "accessToken";

export const commerceApi = createApi({
  reducerPath: "commerceApi",
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
  tagTypes: ["CommerceItems", "PaymentStatus"],
  endpoints: (builder) => ({
    getCommerceItems: builder.query({
      query: () => "/commerce/api/items/",
      providesTags: ["CommerceItems"],
      keepUnusedDataFor: 300,
    }),

    createOrder: builder.mutation({
      query: ({ item_ids, coupon_code }) => {
        const formData = new FormData();
        item_ids.forEach((id) => formData.append("item_ids", id));
        if (coupon_code) formData.append("coupon_code", coupon_code);
        return {
          url: "/commerce/api/orders/create/",
          method: "POST",
          body: formData,
        };
      },
    }),

    createPayment: builder.mutation({
      query: ({ order_id }) => {
        const formData = new FormData();
        formData.append("order_id", order_id);
        return {
          url: "/commerce/api/payments/create/",
          method: "POST",
          body: formData,
        };
      },
    }),

    getPaymentStatus: builder.query({
      query: (paymentId) => `/commerce/api/payments/status/${paymentId}/`,
      providesTags: (result, error, paymentId) => [
        { type: "PaymentStatus", id: paymentId },
      ],
    }),
  }),
});

export const {
  useGetCommerceItemsQuery,
  useCreateOrderMutation,
  useCreatePaymentMutation,
  useGetPaymentStatusQuery,
} = commerceApi;
