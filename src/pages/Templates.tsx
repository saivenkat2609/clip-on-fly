import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star, TrendingUp, Lock, Sparkles } from "lucide-react";
import { getTemplatesByCategory, searchTemplates, getPopularTemplates, getTrendingTemplates, canUserAccessTemplate, Template } from "@/lib/templates";
import { getCachedTemplates } from "@/lib/templateCache";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserPlan } from "@/hooks/useUserProfile";

const categories = ["All", "Professional", "Creative", "Tech", "Lifestyle"];

export default function Templates() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Use cached templates
  const templates = getCachedTemplates();
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(templates);

  // Use cached user plan
  const { plan: userPlan = 'Free', isLoading: loading } = useUserPlan();

  // Filter templates based on search and category
  useEffect(() => {
    let result = templates;

    // Filter by category
    if (selectedCategory !== "All") {
      result = getTemplatesByCategory(selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      result = searchTemplates(searchTerm);
    }

    setFilteredTemplates(result);
  }, [selectedCategory, searchTerm]);

  const handleTemplateClick = (template: Template) => {
    if (!canUserAccessTemplate(template, userPlan)) {
      toast({
        title: "Upgrade Required",
        description: `This template requires ${template.plan} plan or higher. Upgrade to access premium templates.`,
        variant: "destructive",
      });
      // Navigate to billing page
      navigate('/billing');
      return;
    }

    // Navigate to dashboard to select a clip
    toast({
      title: "Select a Clip",
      description: "Go to your projects and click 'Apply Template' on any clip to use this template.",
    });
    navigate('/dashboard');
  };

  const featuredTemplates = getPopularTemplates().slice(0, 3);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Templates</h1>
          <p className="text-muted-foreground">
            Choose from professionally designed video templates to style your clips
          </p>
          {!loading && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-muted-foreground">Your Plan:</span>
              <Badge className="bg-primary text-primary-foreground">
                {userPlan}
              </Badge>
              {userPlan === 'Free' && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => navigate('/billing')}
                >
                  Upgrade for more templates
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        {selectedCategory === "All" && !searchTerm && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Featured Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTemplates.map((template) => {
                const canAccess = canUserAccessTemplate(template, userPlan);

                return (
                  <Card
                    key={template.id}
                    className={`group overflow-hidden shadow-medium hover:shadow-large transition-smooth cursor-pointer ${
                      !canAccess ? 'opacity-75' : ''
                    }`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-smooth">
                        <div className="absolute bottom-4 left-4 right-4">
                          <Button className={canAccess ? "w-full gradient-primary" : "w-full bg-muted text-muted-foreground"}>
                            {canAccess ? "Use Template" : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Upgrade to Use
                              </>
                            )}
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
                      {!canAccess && (
                        <Badge className="absolute bottom-2 left-2 bg-muted text-muted-foreground">
                          <Lock className="h-3 w-3 mr-1" />
                          {template.plan}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {selectedCategory !== "All" || searchTerm ? "Results" : "All Templates"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </span>
          </div>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or category filter
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => {
                const canAccess = canUserAccessTemplate(template, userPlan);

                return (
                  <Card
                    key={template.id}
                    className={`group overflow-hidden shadow-medium hover:shadow-large transition-smooth cursor-pointer ${
                      !canAccess ? 'opacity-75' : ''
                    }`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-smooth">
                        <div className="absolute bottom-4 left-4 right-4">
                          <Button
                            size="sm"
                            className={canAccess ? "w-full gradient-primary" : "w-full bg-muted text-muted-foreground"}
                          >
                            {canAccess ? "Use Template" : (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Locked
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      {template.popular && (
                        <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Popular
                        </Badge>
                      )}
                      {template.trending && !template.popular && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {!canAccess && (
                        <Badge className="absolute bottom-2 left-2 bg-muted text-muted-foreground text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          {template.plan}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                        {template.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
