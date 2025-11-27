import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bell, Key, Users } from "lucide-react";

export default function Settings() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">Change Photo</Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG or GIF. Max size 2MB
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="John" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" className="mt-2" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john@example.com" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" placeholder="Your company name" className="mt-2" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline">Cancel</Button>
                  <Button className="gradient-primary">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Processing Complete</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when your video processing is done
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of your activity
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Product Updates</p>
                      <p className="text-sm text-muted-foreground">
                        News about new features and improvements
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-muted-foreground">
                        Tips, tricks, and promotional content
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button className="gradient-primary">Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>API Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Your API Key</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      type="password" 
                      value="sk_live_xxxxxxxxxxxxxxxxxxxx" 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button variant="outline">Copy</Button>
                    <Button variant="outline">Regenerate</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Keep your API key secure. Do not share it publicly.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-semibold mb-2">API Documentation</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Learn how to integrate ClipForge into your workflow
                  </p>
                  <Button variant="outline" size="sm">
                    View Documentation
                  </Button>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Usage This Month</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">API Calls</p>
                      <p className="text-2xl font-bold">1,247</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">Data Transferred</p>
                      <p className="text-2xl font-bold">45.2 GB</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Settings */}
          <TabsContent value="team">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Team Members</span>
                  <Button className="gradient-primary" size="sm">Invite Member</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "John Doe", email: "john@example.com", role: "Owner" },
                  { name: "Sarah Chen", email: "sarah@example.com", role: "Admin" },
                  { name: "Mike Johnson", email: "mike@example.com", role: "Member" }
                ].map((member, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{member.role}</span>
                      {member.role !== "Owner" && (
                        <Button variant="ghost" size="sm">Remove</Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
