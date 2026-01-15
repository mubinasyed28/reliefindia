import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, Heart, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Story {
  id: string;
  title: string;
  story: string;
  location: string | null;
  image_url: string | null;
}

// Default stories for demo
const defaultStories: Story[] = [
  {
    id: "1",
    title: "A Family Rebuilds",
    story: "After losing everything in the floods, Lakshmi's family received immediate relief through RELIFEX. The tokens helped them buy food, medicine, and essential supplies without any middlemen.",
    location: "Kerala",
    image_url: null,
  },
  {
    id: "2",
    title: "Medical Aid in Time",
    story: "When cyclone struck, Ramesh needed urgent medication for his diabetic mother. With RELIFEX tokens, he could immediately purchase medicines from a verified merchant nearby.",
    location: "Odisha",
    image_url: null,
  },
  {
    id: "3",
    title: "Shelter for 50 Families",
    story: "An NGO used RELIFEX to transparently distribute relief materials to 50 families. Every rupee was tracked, and beneficiaries received exactly what they needed.",
    location: "Assam",
    image_url: null,
  },
];

export function ImpactStories() {
  const [stories, setStories] = useState<Story[]>(defaultStories);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    const { data } = await supabase
      .from("impact_stories")
      .select("*")
      .eq("is_published", true)
      .limit(3);

    if (data && data.length > 0) {
      setStories(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Stories of Impact
        </h2>
        <p className="text-muted-foreground">
          Real stories of people helped through RELIFEX
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {stories.map((story, index) => (
          <Card
            key={story.id}
            className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {story.image_url && (
              <div className="aspect-video bg-muted">
                <img
                  src={story.image_url}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg flex items-start gap-2">
                <Quote className="w-5 h-5 text-primary shrink-0 mt-1" />
                {story.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                {story.story}
              </p>
              {story.location && (
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <MapPin className="w-3 h-3" />
                  {story.location}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
