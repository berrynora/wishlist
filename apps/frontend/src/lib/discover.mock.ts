export type DiscoverItem = {
  id: string;
  title: string;
  price: number;
  store: string;
  image: string;
  priority?: "Low" | "Medium" | "High";
};

export type DiscoverSection = {
  id: string;
  owner: string;
  username: string;
  wishlist: string;
  date?: string;
  items: DiscoverItem[];
};

export const upcomingEvents = {
  title: "Upcoming Events",
  description: "Emma Thompson’s Birthday is in 10 days",
  dates: [
    { name: "Emma", date: "Feb 14" },
    { name: "Michael", date: "Feb 22" },
    { name: "Sophie", date: "Mar 5" },
  ],
};

export const discoverSections: DiscoverSection[] = [
  {
    id: "1",
    owner: "Emma Thompson",
    username: "emma_t",
    wishlist: "Birthday Wishes",
    date: "Feb 14",
    items: [
      {
        id: "i1",
        title: "Vintage Camera",
        price: 299,
        store: "Etsy",
        image: "/mock/camera.jpg",
        priority: "High",
      },
      {
        id: "i2",
        title: "Silk Scarf",
        price: 85,
        store: "Nordstrom",
        image: "/mock/scarf.jpg",
        priority: "Medium",
      },
      {
        id: "i3",
        title: "Cookbook Set",
        price: 45,
        store: "Amazon",
        image: "/mock/book.jpg",
        priority: "Low",
      },
    ],
  },
  {
    id: "2",
    owner: "James Wilson",
    username: "jwilson",
    wishlist: "Gaming Setup",
    items: [
      {
        id: "i4",
        title: "Mechanical Keyboard",
        price: 189,
        store: "Best Buy",
        image: "/mock/keyboard.jpg",
        priority: "High",
      },
      {
        id: "i5",
        title: "Gaming Mouse",
        price: 79,
        store: "Amazon",
        image: "/mock/mouse.jpg",
        priority: "Medium",
      },
    ],
  },
];
