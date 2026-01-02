import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bell, Key, Users, Palette, Mail, Lock, Shield, CheckCircle2, AlertCircle, Share2, Check, Link as LinkIcon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { YouTubeConnection } from "@/components/YouTubeConnection";
import { SignInMethodCard } from "@/components/SignInMethodCard";
import { PasswordInput } from "@/components/PasswordInput";
import { cn } from "@/lib/utils";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, fetchSignInMethodsForEmail } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { useUserProfile, refreshUserProfile } from "@/hooks/useUserProfile";

export default function Settings() {
  const { theme, mode, setTheme, setMode } = useTheme();
  const queryClient = useQueryClient();
  const {
    currentUser,
    changeEmail,
    changePassword,
    resendVerificationEmail,
    refreshUser,
    linkGoogleProvider,
    linkPasswordProvider,
    unlinkProvider,
    getLinkedProviders,
  } = useAuth();

  // Profile information state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initialProfileData, setInitialProfileData] = useState({ firstName: '', lastName: '' });
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
  const [isNewPasswordBreached, setIsNewPasswordBreached] = useState(false);

  // Provider detection state
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);

  // Email verification state
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Account linking state
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [showAddPasswordDialog, setShowAddPasswordDialog] = useState(false);
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newAccountConfirmPassword, setNewAccountConfirmPassword] = useState('');
  const [addPasswordError, setAddPasswordError] = useState('');

  // Unlink provider confirmation dialog state
  const [unlinkDialog, setUnlinkDialog] = useState<{
    open: boolean;
    providerId: 'google.com' | 'password' | null;
    providerName: string;
  }>({ open: false, providerId: null, providerName: '' });

  // Use cached user profile hook
  const { data: profile, isLoading: profileDataLoading } = useUserProfile();

  // Load user profile data from cached hook
  useEffect(() => {
    if (profile) {
      const displayName = currentUser?.displayName || '';
      const names = displayName.split(' ');
      const fName = names[0] || '';
      const lName = names.length > 1 ? names[names.length - 1] : '';

      setFirstName(fName);
      setLastName(lName);
      setInitialProfileData({ firstName: fName, lastName: lName });
    }
  }, [profile, currentUser]);

  // Load provider information
  useEffect(() => {
    async function loadProviderInfo() {
      if (currentUser?.email) {
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, currentUser.email);
          setHasPasswordProvider(signInMethods.includes('password'));
        } catch (error) {
          console.error('Failed to load provider info:', error);
        }
      }
    }

    loadProviderInfo();
  }, [currentUser]);

  // Check if profile data has changed
  const hasProfileChanged = () => {
    return (
      firstName !== initialProfileData.firstName ||
      lastName !== initialProfileData.lastName
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
        displayName: displayName
      });

      // Update Firebase Auth profile (displayName)
      await updateProfile(currentUser, {
        displayName: displayName
      });

      // Normalize values
      const normalizedFirstName = firstName.trim();
      const normalizedLastName = lastName.trim();

      // Update local state to reflect saved changes
      setFirstName(normalizedFirstName);
      setLastName(normalizedLastName);

      // Update initial data to disable save/cancel buttons
      setInitialProfileData({
        firstName: normalizedFirstName,
        lastName: normalizedLastName
      });

      // Invalidate profile cache to refetch updated data
      await refreshUserProfile(currentUser.uid);
      queryClient.invalidateQueries({ queryKey: ['userProfile', currentUser.uid] });

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

  const handleSetBackupPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('No user is currently signed in');
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await linkPasswordProvider(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      setHasPasswordProvider(true);
      toast.success('Backup password set successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to set backup password');
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

  // Account linking handlers
  const handleLinkGoogle = async () => {
    setLinkingLoading(true);
    try {
      await linkGoogleProvider();
      toast.success('Google account linked successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to link Google account');
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPasswordError('');

    if (!newAccountPassword || !newAccountConfirmPassword) {
      setAddPasswordError('Please fill in all fields');
      return;
    }

    if (newAccountPassword !== newAccountConfirmPassword) {
      setAddPasswordError('Passwords do not match');
      return;
    }

    if (newAccountPassword.length < 8) {
      setAddPasswordError('Password must be at least 8 characters');
      return;
    }

    setLinkingLoading(true);
    try {
      await linkPasswordProvider(newAccountPassword);
      toast.success('Password added successfully!');
      setShowAddPasswordDialog(false);
      setNewAccountPassword('');
      setNewAccountConfirmPassword('');
    } catch (error: any) {
      setAddPasswordError(error.message || 'Failed to add password');
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleUnlinkProvider = (providerId: 'google.com' | 'password') => {
    const providerName = providerId === 'google.com' ? 'Google' : 'Email & Password';
    setUnlinkDialog({ open: true, providerId, providerName });
  };

  const confirmUnlinkProvider = async () => {
    if (!unlinkDialog.providerId) return;

    setLinkingLoading(true);
    try {
      await unlinkProvider(unlinkDialog.providerId);
      toast.success(`${unlinkDialog.providerName} unlinked successfully`);
      setUnlinkDialog({ open: false, providerId: null, providerName: '' });
    } catch (error: any) {
      toast.error(error.message || `Failed to unlink ${unlinkDialog.providerName}`);
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleScrollToPasswordSection = () => {
    const passwordSection = document.getElementById('password-section');
    if (passwordSection) {
      passwordSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add a brief highlight effect
      passwordSection.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        passwordSection.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  };

  const isGoogleUser = currentUser?.providerData.some(provider => provider.providerId === 'google.com');
  const linkedProviders = getLinkedProviders();

  // Check if only one method is connected (to disable unlink button)
  const connectedMethodsCount = (linkedProviders.google ? 1 : 0) + (linkedProviders.password ? 1 : 0);
  const hasOnlyOneMethod = connectedMethodsCount === 1;

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
                            "flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all relative",
                            theme === t.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                          )}
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
            <Card id="password-section" className="shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {!linkedProviders.password ? 'Set Backup Password' : 'Change Password'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!linkedProviders.password ? (
                  // Set backup password UI for users without password (Google-only)
                  <div className="space-y-4">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium mb-2">Add a backup password to your account</p>
                        <p className="text-sm text-muted-foreground">
                          Your account currently uses Google sign-in. Adding a password provides a backup way to access your account.
                        </p>
                      </AlertDescription>
                    </Alert>

                    <form onSubmit={handleSetBackupPassword} className="space-y-4">
                      <PasswordInput
                        label="New Password"
                        value={newPassword}
                        onChange={(value) => setNewPassword(value)}
                        placeholder="Create a strong password"
                        showStrengthMeter={true}
                        checkBreaches={true}
                        required={true}
                        autoComplete="new-password"
                        onBreachStatusChange={setIsNewPasswordBreached}
                        disabled={passwordLoading}
                      />

                      <div>
                        <Label htmlFor="confirmBackupPassword">Confirm Password</Label>
                        <Input
                          id="confirmBackupPassword"
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          disabled={passwordLoading}
                          className="mt-2"
                        />
                        {confirmNewPassword && newPassword !== confirmNewPassword && (
                          <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Passwords don't match
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                          type="submit"
                          disabled={
                            passwordLoading ||
                            !newPassword ||
                            !confirmNewPassword ||
                            newPassword !== confirmNewPassword ||
                            newPassword.length < 8 ||
                            isNewPasswordBreached
                          }
                          className="gradient-primary"
                        >
                          {passwordLoading ? 'Setting Password...' : 'Set Backup Password'}
                        </Button>
                      </div>
                      {!passwordLoading && (isNewPasswordBreached || newPassword.length < 8 || newPassword !== confirmNewPassword) && newPassword && (
                        <p className="text-xs text-center text-muted-foreground">
                          {isNewPasswordBreached && '⚠️ Cannot use breached password'}
                          {!isNewPasswordBreached && newPassword.length < 8 && '⚠️ Password must be at least 8 characters'}
                          {!isNewPasswordBreached && newPassword.length >= 8 && newPassword !== confirmNewPassword && '⚠️ Passwords must match'}
                        </p>
                      )}
                    </form>
                  </div>
                ) : (
                  // Change password form for users with password (password-only OR Google+password)
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

                    <PasswordInput
                      label="New Password"
                      value={newPassword}
                      onChange={(value) => setNewPassword(value)}
                      placeholder="Create a strong password"
                      showStrengthMeter={true}
                      checkBreaches={true}
                      required={true}
                      autoComplete="new-password"
                      onBreachStatusChange={setIsNewPasswordBreached}
                      disabled={passwordLoading}
                    />

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
                      {confirmNewPassword && newPassword !== confirmNewPassword && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Passwords don't match
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                      <Button
                        type="submit"
                        disabled={
                          passwordLoading ||
                          !currentPassword ||
                          !newPassword ||
                          !confirmNewPassword ||
                          newPassword !== confirmNewPassword ||
                          newPassword.length < 8 ||
                          isNewPasswordBreached
                        }
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                    {!passwordLoading && (isNewPasswordBreached || newPassword.length < 8 || newPassword !== confirmNewPassword) && newPassword && (
                      <p className="text-xs text-center text-muted-foreground">
                        {isNewPasswordBreached && '⚠️ Cannot use breached password'}
                        {!isNewPasswordBreached && newPassword.length < 8 && '⚠️ Password must be at least 8 characters'}
                        {!isNewPasswordBreached && newPassword.length >= 8 && newPassword !== confirmNewPassword && '⚠️ Passwords must match'}
                      </p>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Sign-in Methods */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Sign-in Methods
                </CardTitle>
                <CardDescription>
                  Manage how you sign in to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Google Sign-in Method */}
                <SignInMethodCard
                  provider="google"
                  connected={linkedProviders.google}
                  email={linkedProviders.google ? currentUser?.email : undefined}
                  onLink={handleLinkGoogle}
                  onUnlink={() => handleUnlinkProvider('google.com')}
                  loading={linkingLoading}
                  disableUnlink={hasOnlyOneMethod}
                />

                {/* Password Sign-in Method */}
                <SignInMethodCard
                  provider="password"
                  connected={linkedProviders.password}
                  email={linkedProviders.password ? currentUser?.email : undefined}
                  onLink={handleScrollToPasswordSection}
                  onUnlink={() => handleUnlinkProvider('password')}
                  loading={linkingLoading}
                  disableUnlink={hasOnlyOneMethod}
                />

                {/* Info Alert */}
                <Alert className="mt-4">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <p className="font-medium mb-1">Multiple sign-in methods</p>
                    <p className="text-xs text-muted-foreground">
                      You can link multiple sign-in methods to your account. This gives you flexibility to sign in with either Google or your password. At least one method must remain linked.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Add Password Dialog */}
            <Dialog open={showAddPasswordDialog} onOpenChange={setShowAddPasswordDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Password to Your Account</DialogTitle>
                  <DialogDescription>
                    Create a password to enable email and password sign-in
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPassword} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-account-password">Password</Label>
                      <PasswordInput
                        value={newAccountPassword}
                        onChange={(value) => {
                          setNewAccountPassword(value);
                          setAddPasswordError('');
                        }}
                        placeholder="Create a password"
                        showStrengthMeter={true}
                        checkBreaches={true}
                        autoComplete="new-password"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm-account-password">Confirm Password</Label>
                      <Input
                        id="confirm-account-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={newAccountConfirmPassword}
                        onChange={(e) => {
                          setNewAccountConfirmPassword(e.target.value);
                          setAddPasswordError('');
                        }}
                        disabled={linkingLoading}
                      />
                    </div>

                    {addPasswordError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{addPasswordError}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddPasswordDialog(false);
                        setNewAccountPassword('');
                        setNewAccountConfirmPassword('');
                        setAddPasswordError('');
                      }}
                      disabled={linkingLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={linkingLoading}>
                      {linkingLoading ? 'Adding...' : 'Add Password'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>

      {/* Unlink Provider Confirmation Dialog */}
      <AlertDialog open={unlinkDialog.open} onOpenChange={(open) => !open && setUnlinkDialog({ open: false, providerId: null, providerName: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink {unlinkDialog.providerName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink <strong>{unlinkDialog.providerName}</strong>?
              {hasOnlyOneMethod ? (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  ⚠️ You must have at least one sign-in method to access your account.
                </span>
              ) : (
                <span className="block mt-2">
                  You will no longer be able to sign in with this method, but you can re-link it later if needed.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={linkingLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlinkProvider}
              disabled={linkingLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {linkingLoading ? 'Unlinking...' : 'Unlink'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
