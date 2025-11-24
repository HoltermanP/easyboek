"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useState } from "react";

const reviews = [
  {
    name: "Sarah de Vries",
    role: "Freelance Designer",
    content: "EasyBoek heeft mijn administratie volledig veranderd. Wat voorheen uren kostte, gaat nu automatisch. De AI herkent alles perfect!",
    rating: 5,
  },
  {
    name: "Mark Janssen",
    role: "IT Consultant",
    content: "Als ZZP'er was boekhouden altijd een nachtmerrie. Nu upload ik gewoon mijn bonnen en het wordt allemaal automatisch verwerkt. Top!",
    rating: 5,
  },
  {
    name: "Lisa van der Berg",
    role: "Marketing Specialist",
    content: "Het Premium pakket is elke euro waard. Volledige ontzorging en ik hoef me nergens zorgen over te maken. Perfect voor drukke ondernemers.",
    rating: 5,
  },
  {
    name: "Tom Bakker",
    role: "Web Developer",
    content: "Eindelijk een boekhoudsysteem dat begrijpt wat ik nodig heb. De automatische BTW-berekeningen besparen me zoveel tijd.",
    rating: 5,
  },
  {
    name: "Emma Smit",
    role: "Content Creator",
    content: "Ik dacht dat boekhouden ingewikkeld moest zijn, maar EasyBoek maakt het zo simpel. Alles is overzichtelijk en duidelijk.",
    rating: 5,
  },
  {
    name: "David Mulder",
    role: "Consultant",
    content: "De ondersteuning is fantastisch en het systeem werkt gewoon. Geen gedoe meer met Excel sheets en handmatige berekeningen.",
    rating: 5,
  },
];

// Dupliceer reviews voor seamless scroll
const duplicatedReviews = [...reviews, ...reviews];

export function ReviewsCarousel() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section className="py-20 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            Wat onze klanten zeggen
          </h2>
          <p className="text-slate-600">
            Duizenden ZZP&apos;ers vertrouwen op EasyBoek
          </p>
        </div>

        <div className="relative">
          {/* Gradient overlays voor smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden">
            <div
              className="flex animate-scroll-reviews gap-6"
              style={{ animationPlayState: isPaused ? "paused" : "running" }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {duplicatedReviews.map((review, index) => (
                <Card
                  key={index}
                  className="min-w-[350px] max-w-[350px] flex-shrink-0"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 italic">
                      &quot;{review.content}&quot;
                    </p>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {review.name}
                      </p>
                      <p className="text-sm text-slate-600">{review.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

