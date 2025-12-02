import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Star, TrendingUp, Lock, Check } from "lucide-react";
import { templates, getTemplatesByCategory, searchTemplates, canUserAccessTemplate, Template } from "@/lib/templates";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface TemplateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  currentTemplateId?: string;
  userPlan: 'Free' | 'Starter' | 'Professional';
}

const categories = ["All", "Professional", "Creative", "Tech", "Lifestyle"];

export function TemplateSelectionModal({
  open,
  onClose,
  onSelectTemplate,
  currentTemplateId,
  userPlan
}: TemplateSelectionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(templates);
  const { toast } = useToast();

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

  const handleTemplateSelect = (template: Template) => {
    if (!canUserAccessTemplate(template, userPlan)) {
      toast({
        title: "Upgrade Required",
        description: `This template requires ${template.plan} plan or higher.`,
        variant: "destructive",
      });
      return;
    }

    onSelectTemplate(template);
    toast({
      title: "Template Applied",
      description: `${template.name} has been applied to your clip.`,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">Choose a Template</DialogTitle>
          <DialogDescription>
            Select a professionally designed template to style your clip
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
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

          {/* Plan Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Your Plan:</span>
              <Badge className="bg-primary text-primary-foreground">
                {userPlan}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Templates Grid */}
        <ScrollArea className="h-[500px] px-6 pb-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No templates found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredTemplates.map((template) => {
                const canAccess = canUserAccessTemplate(template, userPlan);
                const isSelected = template.id === currentTemplateId;

                return (
                  <Card
                    key={template.id}
                    className={`group overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer ${
                      isSelected ? 'border-primary border-2' : 'border-border/50'
                    } ${!canAccess ? 'opacity-60' : ''}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                          <Button
                            size="sm"
                            className={canAccess ? "gradient-primary" : "bg-muted text-muted-foreground"}
                            disabled={!canAccess}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Selected
                              </>
                            ) : canAccess ? (
                              "Use Template"
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Locked
                              </>
                            )}
                          </Button>
                          {!canAccess && (
                            <p className="text-xs text-white text-center">
                              Requires {template.plan} plan
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      {isSelected && (
                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {template.popular && (
                        <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs">
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
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-muted text-muted-foreground">
                            <Lock className="h-3 w-3 mr-1" />
                            {template.plan}
                          </Badge>
                        </div>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
