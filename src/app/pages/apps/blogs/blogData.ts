interface blogPosts {
  id: number;
  time: string;
  imgSrc: string;
  user: string;
  title: string;
  views: string;
  category: string;
  comments: number;
  featuredPost: boolean;
  date: string;
  link: string;
}

export const blogPosts: blogPosts[] = [
  {
    id: 1,
    time: '2 mins Read',
    imgSrc: 'https://i-nimble.com/wp-content/uploads/2025/04/ChatGPT-Image-Apr-2-2025-05_09_21-PM-1.png',
    user: '/assets/images/profile/user-1.jpg',
    title: 'What This New ChatGPT Trend Reveals About the Future of AI in Business ',
    views: '9,125',
    category: 'Gadget',
    comments: 3,
    featuredPost: true,
    date: '8, Apr 25',
    link: 'https://i-nimble.com/2025/04/08/what-this-new-chatgpt-trend-reveals-about-the-future-of-ai-in-business/',  
  },
  {
    id: 2,
    time: '2 mins Read',
    imgSrc: 'https://i-nimble.com/wp-content/uploads/2025/04/Imagen-blog-19.png',
    user: '/assets/images/profile/user-2.jpg',
    title: 'What We’ve Learned from Working with Businesses Across the U.S. And What You Can Learn Too',
    views: '9,125',
    category: 'Health',
    comments: 3,
    featuredPost: false,
    date: '8, Apr 25',
    link: 'https://i-nimble.com/2025/04/08/what-weve-learned-from-working-with-businesses-across-the-u-s-and-what-you-can-learn-too/'
  },
  {
    id: 3,
    time: '2 mins Read',
    imgSrc: 'https://i-nimble.com/wp-content/uploads/2025/03/Imagen-blog-18.png',
    user: '/assets/images/profile/user-3.jpg',
    title: 'The All-in-One Platform businesses Didn’t Know They Needed (Until Now)',
    views: '9,125',
    category: 'Gadget',
    comments: 12,
    featuredPost: false,
    date: '6, Mar 25',
    link: 'https://i-nimble.com/2025/03/06/the-all-in-one-platform-businesses-didnt-know-they-needed-until-now/'
  },
  {
    id: 4,
    time: '2 mins Read',
    imgSrc: 'https://i-nimble.com/wp-content/uploads/2025/03/Imagen-blog-17-600x380.png',
    user: '/assets/images/profile/user-4.jpg',
    title:
      'Managing Remote Teams Just Got Easier — Track Time, Set KPIs & Get Performance Reviews All in One Place',
    views: '9,125',
    category: 'Social',
    comments: 12,
    featuredPost: false,
    date: '6, Mar 25',
    link: 'https://i-nimble.com/2025/03/06/managing-remote-teams-just-got-easier-track-time-set-kpis-get-performance-reviews-all-in-one-place/'
  },
  {
    id: 5,
    time: '2 mins Read',
    imgSrc: 'https://i-nimble.com/wp-content/uploads/2025/02/Imagen-blog-16-16-600x380.png',
    user: '/assets/images/profile/user-1.jpg',
    title: 'The Best Time-Tracker for Your Remote Team ',
    views: '9,125',
    category: 'Lifestyle',
    comments: 3,
    featuredPost: false,
    date: '18, Feb 25',
    link: 'https://i-nimble.com/2025/02/18/the-best-time-tracker-for-your-remote-team/'
  },
  // {
  //   id: 6,
  //   time: '2 mins Read',
  //   imgSrc: '/assets/images/blog/blog-img6.jpg',
  //   user: '/assets/images/profile/user-2.jpg',
  //   title: 'Streaming video way before it was cool, go dark tomorrow',
  //   views: '9,125',
  //   category: 'Health',
  //   comments: 3,
  //   featuredPost: false,
  //   date: 'Sun, Dec 25',
  // },
  // {
  //   id: 7,
  //   time: '2 mins Read',
  //   imgSrc: '/assets/images/blog/blog-img8.jpg',
  //   user: '/assets/images/profile/user-3.jpg',
  //   title:
  //     'Apple is apparently working on a new ‘streamlined’ accessibility iOS',
  //   views: '9,125',
  //   category: 'Design',
  //   comments: 12,
  //   featuredPost: false,
  //   date: 'Sat, Dec 25',
  // },
  // {
  //   id: 8,
  //   time: '2 mins Read',
  //   imgSrc: '/assets/images/blog/blog-img9.jpg',
  //   user: '/assets/images/profile/user-4.jpg',
  //   title: 'After Twitter Staff Cuts, Survivors Face ‘Radio Silence',
  //   views: '9,125',
  //   category: 'Lifestyle',
  //   comments: 12,
  //   featuredPost: false,
  //   date: 'Sat, Dec 25',
  // },
  // {
  //   id: 9,
  //   time: '2 mins Read',
  //   imgSrc: '/assets/images/blog/blog-img10.jpg',
  //   user: '/assets/images/profile/user-1.jpg',
  //   title: 'Why Figma is selling to Adobe for $20 billion',
  //   views: '9,125',
  //   category: 'Design',
  //   comments: 3,
  //   featuredPost: false,
  //   date: 'Mon, Dec 25',
  // },
  // {
  //   id: 10,
  //   time: '2 mins Read',
  //   imgSrc: '/assets/images/blog/blog-img11.jpg',
  //   user: '/assets/images/profile/user-2.jpg',
  //   title: 'Garmins Instinct Crossover is a rugged hybrid smartwatch',
  //   views: '9,125',
  //   category: 'Gadget',
  //   comments: 3,
  //   featuredPost: false,
  //   date: 'Sun, Dec 25',
  // },
];


