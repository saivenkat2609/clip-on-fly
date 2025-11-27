import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star, TrendingUp, Sparkles } from "lucide-react";

const templates = [
  {
    id: 1,
    name: "Modern Minimal",
    category: "Professional",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop",
    popular: true
  },
  {
    id: 2,
    name: "Bold & Energetic",
    category: "Creative",
    thumbnail: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=600&fit=crop",
    trending: true
  },
  {
    id: 3,
    name: "Elegant Serif",
    category: "Professional",
    thumbnail: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400&h=600&fit=crop"
  },
  {
    id: 4,
    name: "Playful Pop",
    category: "Creative",
    thumbnail: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=600&fit=crop",
    popular: true
  },
  {
    id: 5,
    name: "Tech Futuristic",
    category: "Tech",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=600&fit=crop"
  },
  {
    id: 6,
    name: "Warm & Cozy",
    category: "Lifestyle",
    thumbnail: "https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=400&h=600&fit=crop",
    trending: true
  },
  {
    id: 7,
    name: "Corporate Clean",
    category: "Professional",
    thumbnail: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400&h=600&fit=crop"
  },
  {
    id: 8,
    name: "Retro Vibe",
    category: "Creative",
    thumbnail: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=600&fit=crop"
  },
  {
    id: 9,
    name: "Minimalist Dark",
    category: "Professional",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop",
    popular: true
  }
];

const categories = ["All", "Professional", "Creative", "Tech", "Lifestyle"];

export default function Templates() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Templates</h1>
          <p className="text-muted-foreground">Choose from professionally designed video templates</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." className="pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Featured Templates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.slice(0, 3).map((template) => (
              <Card key={template.id} className="group overflow-hidden shadow-medium hover:shadow-large transition-smooth cursor-pointer">
                <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-smooth">
                    <div className="absolute bottom-4 left-4 right-4">
                      <Button className="w-full gradient-primary">
                        Use Template
                      </Button>
                    </div>
                  </div>
                  {template.popular && (
                    <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Popular
                    </Badge>
                  )}
                  {template.trending && (
                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Templates */}
        <div>
          <h2 className="text-xl font-bold mb-4">All Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="group overflow-hidden shadow-medium hover:shadow-large transition-smooth cursor-pointer">
                <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-smooth">
                    <div className="absolute bottom-4 left-4 right-4">
                      <Button className="w-full gradient-primary" size="sm">
                        Use Template
                      </Button>
                    </div>
                  </div>
                  {template.popular && (
                    <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Popular
                    </Badge>
                  )}
                  {template.trending && (
                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">{template.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
