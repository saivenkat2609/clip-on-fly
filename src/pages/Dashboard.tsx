import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Clock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const projects = [
  {
    id: 1,
    title: "Marketing Webinar Highlights",
    thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=225&fit=crop",
    duration: "45:30",
    clips: 8,
    date: "2 days ago",
    status: "completed"
  },
  {
    id: 2,
    title: "Product Demo Session",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop",
    duration: "28:15",
    clips: 5,
    date: "1 week ago",
    status: "completed"
  },
  {
    id: 3,
    title: "Podcast Episode #42",
    thumbnail: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=225&fit=crop",
    duration: "1:12:45",
    clips: 12,
    date: "2 weeks ago",
    status: "completed"
  },
  {
    id: 4,
    title: "Interview with CEO",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=225&fit=crop",
    duration: "35:20",
    clips: 6,
    date: "3 weeks ago",
    status: "completed"
  },
  {
    id: 5,
    title: "Tutorial Series Compilation",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop",
    duration: "52:10",
    clips: 10,
    date: "1 month ago",
    status: "completed"
  },
  {
    id: 6,
    title: "Live Stream Recap",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=225&fit=crop",
    duration: "2:15:30",
    clips: 15,
    date: "1 month ago",
    status: "completed"
  }
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">Manage and edit your video projects</p>
          </div>
          <Link to="/upload">
            <Button size="lg" className="gradient-primary shadow-medium">
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Projects", value: "24", change: "+3 this month" },
            { label: "Clips Generated", value: "156", change: "+28 this week" },
            { label: "Processing Time", value: "12.5h", change: "Saved this month" },
            { label: "Storage Used", value: "8.2 GB", change: "of 50 GB" }
          ].map((stat) => (
            <Card key={stat.label} className="shadow-soft">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} to={`/editor/${project.id}`}>
                <Card className="group overflow-hidden shadow-medium hover:shadow-large transition-smooth cursor-pointer">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img 
                      src={project.thumbnail} 
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                      {project.clips} clips
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">{project.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{project.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{project.date}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
