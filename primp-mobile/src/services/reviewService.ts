import api from "./api";

export interface ReviewData {
  bookingId: number;
  revieweeId: number;
  rating: number;
  comment: string;
}

export interface Review {
  id: number;
  bookingId: number;
  reviewerId: number;
  revieweeId: number;
  reviewerRole: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface RatingSummary {
  userId: number;
  averageRating: number;
  totalReviews: number;
}

export const submitReview = async (data: ReviewData): Promise<Review> => {
  const response = await api.post<Review>("/api/reviews", data);
  return response.data;
};

export const getReviewsForUser = async (userId: number): Promise<Review[]> => {
  const response = await api.get<Review[]>(`/api/reviews/user/${userId}`);
  return response.data;
};

export const getRatingSummary = async (
  userId: number,
): Promise<RatingSummary> => {
  const response = await api.get<RatingSummary>(
    `/api/reviews/summary/${userId}`,
  );
  return response.data;
};
