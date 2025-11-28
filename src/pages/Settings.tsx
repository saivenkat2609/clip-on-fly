import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bell, Key, Users, Palette, Mail, Lock, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function Settings() {
  const { theme, mode, setTheme, setMode } = useTheme();
  const { currentUser, changeEmail, changePassword, resendVerificationEmail } = useAuth();

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email verification state
  const [verificationLoading, setVerificationLoading] = useState(false);

  const getUserInitials = () => {
    if (!currentUser) return "??";
    if (currentUser.displayName) {
      const names = currentUser.displayName.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return currentUser.displayName.substring(0, 2).toUpperCase();
    }
    if (currentUser.email) {
      return currentUser.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getFirstName = () => {
    if (!currentUser?.displayName) return "";
    return currentUser.displayName.split(" ")[0];
  };

  const getLastName = () => {
    if (!currentUser?.displayName) return "";
    const names = currentUser.displayName.split(" ");
    return names.length > 1 ? names[names.length - 1] : "";
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !emailPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setEmailLoading(true);
    try {
      await changeEmail(newEmail, emailPassword);
      setNewEmail('');
      setEmailPassword('');
      toast.success('Email updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationLoading(true);
    try {
      await resendVerificationEmail();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email');
    } finally {
      setVerificationLoading(false);
    }
  };

  const isGoogleUser = currentUser?.providerData.some(provider => provider.providerId === 'google.com');

  const themes = [
    { id: "indigo", name: "Indigo", colors: ["hsl(250 80% 60%)", "hsl(280 70% 65%)", "hsl(35 100% 60%)"] },
    { id: "ocean", name: "Ocean", colors: ["hsl(200 90% 50%)", "hsl(220 80% 55%)", "hsl(180 100% 45%)"] },
    { id: "sunset", name: "Sunset", colors: ["hsl(15 95% 60%)", "hsl(340 100% 60%)", "hsl(30 100% 60%)"] },
    { id: "forest", name: "Forest", colors: ["hsl(150 70% 45%)", "hsl(130 65% 50%)", "hsl(80 100% 50%)"] },
    { id: "cyber", name: "Cyber", colors: ["hsl(280 100% 60%)", "hsl(300 90% 65%)", "hsl(170 100% 50%)"] },
    { id: "rose", name: "Rose", colors: ["hsl(330 80% 60%)", "hsl(310 75% 65%)", "hsl(20 100% 65%)"] },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Theme</span>
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

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Theme Mode */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">Mode</Label>
                  <RadioGroup 
                    value={mode} 
                    onValueChange={(value) => {
                      setMode(value as "light" | "dark");
                      toast.success("Mode updated");
                    }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:border-accent cursor-pointer transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value="light" id="light" className="sr-only" />
                      <div className="space-y-2 w-full">
                        <div className="flex items-center justify-center p-6 rounded-md bg-background border border-border">
                          <div className="text-foreground font-semibold">Aa</div>
                        </div>
                        <div className="text-center font-medium">Light</div>
                      </div>
                    </Label>
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:border-accent cursor-pointer transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value="dark" id="dark" className="sr-only" />
                      <div className="space-y-2 w-full">
                        <div className="flex items-center justify-center p-6 rounded-md bg-slate-900 border border-slate-700">
                          <div className="text-slate-50 font-semibold">Aa</div>
                        </div>
                        <div className="text-center font-medium">Dark</div>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                {/* Color Theme */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">Color Theme</Label>
                  <RadioGroup 
                    value={theme} 
                    onValueChange={(value) => {
                      setTheme(value as any);
                      toast.success(`${value.charAt(0).toUpperCase() + value.slice(1)} theme applied`);
                    }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    {themes.map((t) => (
                      <Label
                        key={t.id}
                        htmlFor={t.id}
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:border-accent cursor-pointer transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem value={t.id} id={t.id} className="sr-only" />
                        <div className="space-y-3 w-full">
                          <div className="flex gap-1.5 justify-center">
                            {t.colors.map((color, i) => (
                              <div
                                key={i}
                                className="h-8 w-8 rounded-full shadow-soft"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="text-center font-medium">{t.name}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Theme changes are applied instantly
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            {/* Email Verification Status */}
            {!isGoogleUser && currentUser && !currentUser.emailVerified && (
              <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="flex items-center justify-between">
                  <div className="text-sm text-orange-800 dark:text-orange-200">
                    <p className="font-medium">Email not verified</p>
                    <p className="text-xs mt-1">
                      Please verify your email address to access all features.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={verificationLoading}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    {verificationLoading ? 'Sending...' : 'Resend Email'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Account Information */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{currentUser?.displayName || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                    {currentUser?.emailVerified && (
                      <div className="flex items-center gap-1 mt-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-xs">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={getFirstName()} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={getLastName()} className="mt-2" />
                  </div>
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

            {/* Email Change */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Change Email Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isGoogleUser ? (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Your account uses Google sign-in. To change your email, please update it in your Google account settings.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleEmailChange} className="space-y-4">
                    <div>
                      <Label htmlFor="currentEmail">Current Email</Label>
                      <Input
                        id="currentEmail"
                        type="email"
                        value={currentUser?.email || ''}
                        disabled
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="newEmail">New Email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="newemail@gmail.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        disabled={emailLoading}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Only Gmail addresses are allowed
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="emailPassword">Current Password</Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        placeholder="Enter your current password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        disabled={emailLoading}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Required for security verification
                      </p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                      <Button
                        type="submit"
                        disabled={emailLoading || !newEmail || !emailPassword}
                      >
                        {emailLoading ? 'Updating...' : 'Update Email'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isGoogleUser ? (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Your account uses Google sign-in and does not have a password. Your security is managed by Google.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={passwordLoading}
                        className="mt-2"
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={passwordLoading}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be at least 8 characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        disabled={passwordLoading}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                      <Button
                        type="submit"
                        disabled={passwordLoading || !currentPassword || !newPassword || !confirmNewPassword}
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                )}
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
                  {
                    name: currentUser?.displayName || "User",
                    email: currentUser?.email || "",
                    role: "Owner"
                  },
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
