import React from "react";
import SEOHead from "@/components/seo/SEOHead";
import { generateBreadcrumbStructuredData } from "@/utils/seoUtils";
import { Link } from "react-router-dom";
import { ExternalLink, Rss } from "lucide-react";

type PodcastEntry = {
  id: string;
  title: string;
  description: string;
  feedUrl: string;
  artworkUrl: string;
};

const PODCASTS: PodcastEntry[] = [
  {
    id: "ein-yaakov",
    title: "אגדות הש״ס - עין יעקב | רון נחשון",
    description: "שיעורים מעמיקים בעין יעקב (אגדות הש״ס).",
    feedUrl: "https://www.midrashaggadah.com/podcast/carmei-zion/series/ein-yaakov.xml",
    artworkUrl:
      "https://www.midrashaggadah.com/images/artwork_for_podcasts/ein_yaakov.jpeg",
  },
  {
    id: "gemara_beiyyun",
    title: "גמרא בעיון | כרמי ציון",
    description: "שיעורים מעמיקים בעיון בגמרא מאת רבני ותלמידי כרמי ציון.",
    feedUrl:
      "https://www.midrashaggadah.com/podcast/carmei-zion/series/gemara_beiyyun.xml",
    artworkUrl:
      "https://www.midrashaggadah.com/images/artwork_for_podcasts/gemara_beiyyun.jpeg",
  },
  {
    id: "daf_yomi",
    title: "דף יומי | כרמי ציון",
    description: "שיעורי דף יומי.",
    feedUrl: "https://www.midrashaggadah.com/podcast/carmei-zion/series/daf_yomi.xml",
    artworkUrl: "https://www.midrashaggadah.com/images/artwork_for_podcasts/daf_yomi.jpeg",
  },
  {
    id: "shiurim_meyuhadim",
    title: "שיעורים מיוחדים | כרמי ציון",
    description: "שיעורים מיוחדים מאורחים וחברי הקהילה.",
    feedUrl:
      "https://www.midrashaggadah.com/podcast/carmei-zion/series/shiurim_meyuhadim.xml",
    artworkUrl:
      "https://www.midrashaggadah.com/images/artwork_for_podcasts/shiurim_meyuhadim.jpeg",
  },
  {
    id: "shiurim_harav_grossman",
    title: "שיעורי הרב עמינדב גרוסמן | כרמי ציון",
    description: "שיעורים מאת הרב עמינדב גרוסמן.",
    feedUrl:
      "https://www.midrashaggadah.com/podcast/carmei-zion/series/shiurim_harav_grossman.xml",
    artworkUrl:
      "https://www.midrashaggadah.com/images/artwork_for_podcasts/shiurim_harav_grossman.jpeg",
  },
];

const PodcastsPage: React.FC = () => {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://midrashaggadah.com";
  const canonicalUrl = `${baseUrl}/podcasts`;

  const breadcrumbs = generateBreadcrumbStructuredData(
    [
      { name: "Home", url: "/" },
      { name: "Podcasts", url: "/podcasts" },
    ],
    baseUrl
  );

  const structuredData = [
    breadcrumbs,
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Podcast Feeds",
      description:
        "Podcast feeds from Midrash Aggadah / Carmei Zion. Subscribe in your favorite podcast app.",
      url: canonicalUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Midrash Aggadah",
        url: baseUrl,
      },
      mainEntity: {
        "@type": "ItemList",
        name: "Carmei Zion Podcast Feeds",
        numberOfItems: PODCASTS.length,
        itemListElement: PODCASTS.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "PodcastSeries",
            name: p.title,
            description: p.description,
            url: p.feedUrl,
            image: p.artworkUrl,
            inLanguage: ["he", "en"],
            publisher: {
              "@type": "Organization",
              name: "Midrash Aggadah",
              url: baseUrl,
            },
          },
        })),
      },
    },
  ];

  return (
    <div className="min-h-screen py-8 pt-20 md:pt-8">
      <SEOHead
        title="Podcast Feeds"
        description="Subscribe to Midrash Aggadah / Carmei Zion podcasts (Ein Yaakov, Daf Yomi, Gemara Be’iyyun, and more)."
        canonicalUrl={canonicalUrl}
        ogType="website"
        structuredData={structuredData}
        keywords={[
          "podcast",
          "rss",
          "shiurim",
          "ein yaakov podcast",
          "daf yomi podcast",
          "gemara podcast",
          "כרמי ציון",
          "שיעורים",
          "פודקאסט",
        ]}
      />

      <div className="content-container">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-biblical-brown">
              Podcast Feeds
            </h1>
            <p className="text-biblical-brown/80 mt-3">
              Use these RSS links to subscribe in Spotify, Apple Podcasts, Pocket
              Casts, Amazon Music, and more.
            </p>
          </div>

          <div className="bg-white/90 rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div className="flex items-center gap-2 text-biblical-brown font-semibold mb-2">
              <Rss size={18} />
              <span>Feeds</span>
            </div>
            <div className="grid gap-3">
              {PODCASTS.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-parchment-dark rounded-lg p-4"
                >
                  <div className="min-w-0">
                    <div className="font-hebrew text-black text-lg leading-tight">
                      {p.title}
                    </div>
                    <div className="text-sm text-biblical-brown/80 mt-1">
                      {p.description}
                    </div>
                    <div className="text-xs text-biblical-brown/70 mt-2 break-all">
                      {p.feedUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={p.feedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-biblical-brown text-white hover:bg-biblical-brown/90 text-sm"
                    >
                      <ExternalLink size={16} />
                      Open RSS
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-biblical-brown/80">
            <Link to="/catalog" className="underline hover:text-biblical-brown">
              Browse shiurim on the site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodcastsPage;


