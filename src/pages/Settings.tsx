import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bell, Key, Users, Palette, Mail, Lock, Shield, CheckCircle2, AlertCircle, Share2, Check } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { YouTubeConnection } from "@/components/YouTubeConnection";
import { cn } from "@/lib/utils";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase";

export default function Settings() {
  const { theme, mode, setTheme, setMode } = useTheme();
  const { currentUser, changeEmail, changePassword, resendVerificationEmail, refreshUser } = useAuth();

  // Profile information state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [initialProfileData, setInitialProfileData] = useState({ firstName: '', lastName: '', company: '' });
  const [profileLoading, setProfileLoading] = useState(false);

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

  // Load user profile data from Firestore
  useEffect(() => {
    async function loadProfile() {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const displayName = currentUser.displayName || '';
            const names = displayName.split(' ');
            const fName = names[0] || '';
            const lName = names.length > 1 ? names[names.length - 1] : '';
            const comp = userData.company || '';

            setFirstName(fName);
            setLastName(lName);
            setCompany(comp);
            setInitialProfileData({ firstName: fName, lastName: lName, company: comp });
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      }
    }

    loadProfile();
  }, [currentUser]);

  // Check if profile data has changed
  const hasProfileChanged = () => {
    return (
      firstName !== initialProfileData.firstName ||
      lastName !== initialProfileData.lastName ||
      company !== initialProfileData.company
    );
  };

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('No user is currently signed in');
      return;
    }

    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setProfileLoading(true);
    try {
      // Construct full display name
      const displayName = lastName.trim()
        ? `${firstName.trim()} ${lastName.trim()}`
        : firstName.trim();

      // Update Firestore profile
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: displayName,
        company: company.trim()
      });

      // Update Firebase Auth profile (displayName)
      await updateProfile(currentUser, {
        displayName: displayName
      });

      // Normalize values
      const normalizedFirstName = firstName.trim();
      const normalizedLastName = lastName.trim();
      const normalizedCompany = company.trim();

      // Update local state to reflect saved changes
      setFirstName(normalizedFirstName);
      setLastName(normalizedLastName);
      setCompany(normalizedCompany);

      // Update initial data to disable save/cancel buttons
      setInitialProfileData({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        company: normalizedCompany
      });

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    // Reset form to initial values
    setFirstName(initialProfileData.firstName);
    setLastName(initialProfileData.lastName);
    setCompany(initialProfileData.company);
    toast.info('Changes discarded');
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
    {
      id: "indigo",
      name: "Indigo",
      colors: ["hsl(250 80% 60%)", "hsl(280 70% 65%)", "hsl(35 100% 60%)"],
      hoverBg: "hsl(250 80% 60% / 0.1)",
      hoverBorder: "hsl(250 80% 60% / 0.3)"
    },
    {
      id: "ocean",
      name: "Ocean",
      colors: ["hsl(200 90% 50%)", "hsl(220 80% 55%)", "hsl(180 100% 45%)"],
      hoverBg: "hsl(200 90% 50% / 0.1)",
      hoverBorder: "hsl(200 90% 50% / 0.3)"
    },
    {
      id: "sunset",
      name: "Sunset",
      colors: ["hsl(15 95% 60%)", "hsl(340 100% 60%)", "hsl(30 100% 60%)"],
      hoverBg: "hsl(15 95% 60% / 0.1)",
      hoverBorder: "hsl(15 95% 60% / 0.3)"
    },
    {
      id: "forest",
      name: "Forest",
      colors: ["hsl(150 70% 45%)", "hsl(130 65% 50%)", "hsl(80 100% 50%)"],
      hoverBg: "hsl(150 70% 45% / 0.1)",
      hoverBorder: "hsl(150 70% 45% / 0.3)"
    },
    {
      id: "cyber",
      name: "Cyber",
      colors: ["hsl(280 100% 60%)", "hsl(300 90% 65%)", "hsl(170 100% 50%)"],
      hoverBg: "hsl(280 100% 60% / 0.1)",
      hoverBorder: "hsl(280 100% 60% / 0.3)"
    },
    {
      id: "rose",
      name: "Rose",
      colors: ["hsl(330 80% 60%)", "hsl(310 75% 65%)", "hsl(20 100% 65%)"],
      hoverBg: "hsl(330 80% 60% / 0.1)",
      hoverBorder: "hsl(330 80% 60% / 0.3)"
    },
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
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Social</span>
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

          {/* Social Media Settings */}
          <TabsContent value="social">
            <YouTubeConnection />
          </TabsContent>

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
                    <div className="relative group">
                      <Label
                        htmlFor="light"
                        className={cn(
                          "flex flex-col items-center justify-between rounded-lg border-2 bg-card p-4 cursor-pointer transition-all relative",
                          mode === "light"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border group-hover:border-slate-300 group-hover:bg-slate-50 dark:group-hover:border-slate-600 dark:group-hover:bg-slate-800/50"
                        )}
                      >
                        <RadioGroupItem value="light" id="light" className="sr-only" />
                        {mode === "light" && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-center p-6 rounded-md bg-white border border-slate-200 shadow-sm">
                            <div className="text-slate-900 font-semibold text-lg">Aa</div>
                          </div>
                          <div className="text-center font-medium">Light</div>
                        </div>
                      </Label>
                    </div>
                    <div className="relative group">
                      <Label
                        htmlFor="dark"
                        className={cn(
                          "flex flex-col items-center justify-between rounded-lg border-2 bg-card p-4 cursor-pointer transition-all relative",
                          mode === "dark"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border group-hover:border-slate-600 group-hover:bg-slate-800/30 dark:group-hover:border-slate-500 dark:group-hover:bg-slate-700/50"
                        )}
                      >
                        <RadioGroupItem value="dark" id="dark" className="sr-only" />
                        {mode === "dark" && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-center p-6 rounded-md bg-slate-900 border border-slate-700 shadow-sm">
                            <div className="text-slate-50 font-semibold text-lg">Aa</div>
                          </div>
                          <div className="text-center font-medium">Dark</div>
                        </div>
                      </Label>
                    </div>
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
                      <div key={t.id} className="relative group">
                        <Label
                          htmlFor={t.id}
                          className={cn(
                            "flex flex-col items-center justify-between rounded-lg border-2 bg-card p-4 cursor-pointer transition-all relative",
                            theme === t.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border"
                          )}
                          style={
                            theme !== t.id
                              ? {
                                  // @ts-ignore
                                  "--hover-bg": t.hoverBg,
                                  "--hover-border": t.hoverBorder,
                                } as React.CSSProperties
                              : undefined
                          }
                          onMouseEnter={(e) => {
                            if (theme !== t.id) {
                              e.currentTarget.style.backgroundColor = t.hoverBg;
                              e.currentTarget.style.borderColor = t.hoverBorder;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (theme !== t.id) {
                              e.currentTarget.style.backgroundColor = "";
                              e.currentTarget.style.borderColor = "";
                            }
                          }}
                        >
                          <RadioGroupItem value={t.id} id={t.id} className="sr-only" />
                          {theme === t.id && (
                            <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center z-10">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                          <div className="space-y-3 w-full">
                            <div className="flex gap-1.5 justify-center">
                              {t.colors.map((color, i) => (
                                <div
                                  key={i}
                                  className="h-8 w-8 rounded-full shadow-soft ring-1 ring-black/5"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <div className="text-center font-medium">{t.name}</div>
                          </div>
                        </Label>
                      </div>
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
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
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
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={profileLoading}
                        className="mt-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={profileLoading}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Your company name"
                      disabled={profileLoading}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleProfileCancel}
                      disabled={profileLoading || !hasProfileChanged()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="gradient-primary"
                      disabled={profileLoading || !hasProfileChanged()}
                    >
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
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
