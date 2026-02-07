export type WishlistVisibility = "Public" | "Friends only" | "Private";

export type WishlistAccent = "pink" | "blue" | "peach" | "mint" | "lavender";

export type Wishlist = {
  id: string;
  title: string;
  itemsCount: number;
  visibility: WishlistVisibility;
  accent: WishlistAccent;
};
