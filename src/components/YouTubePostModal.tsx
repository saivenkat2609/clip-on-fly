import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Youtube, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface YouTubePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  defaultTitle: string;
  clipIndex?: number;
}

export function YouTubePostModal({
  open,
  onOpenChange,
  videoUrl,
  defaultTitle,
  clipIndex
}: YouTubePostModalProps) {
  const { currentUser } = useAuth();
  const [hasConnection, setHasConnection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Form fields
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');

  useEffect(() => {
    if (open && currentUser) {
      checkConnection();
    }
  }, [open, currentUser]);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'user_social_connections'),
        where('userId', '==', currentUser!.uid),
        where('platform', '==', 'youtube'),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      setHasConnection(!snapshot.empty);
    } catch (error) {
      console.error('Error checking YouTube connection:', error);
      toast.error('Failed to check YouTube connection');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);
    setUploadProgress('Preparing upload...');
    setUploadSuccess(false);

    try {
      setUploadProgress('Uploading to YouTube...');

      const uploadToYouTube = httpsCallable(functions, 'uploadToYouTube');
      const result = await uploadToYouTube({
        videoUrl,
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        privacy,
        categoryId: '22' // People & Blogs
      });

      const data = result.data as any;

      if (data.success) {
        setUploadProgress('Upload successful!');
        setUploadSuccess(true);
        setYoutubeUrl(data.url);
        toast.success('Video posted to YouTube successfully!', {
          description: 'Your video is now live on your channel.',
          action: {
            label: 'View on YouTube',
            onClick: () => window.open(data.url, '_blank')
          }
        });

        // Close modal after 2 seconds
        setTimeout(() => {
          onOpenChange(false);
          resetForm();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadProgress('');

      let errorMessage = 'Failed to upload to YouTube';
      if (error.message.includes('quota')) {
        errorMessage = 'YouTube API quota exceeded. Please try again tomorrow.';
      } else if (error.message.includes('not-found')) {
        errorMessage = 'Please connect your YouTube account first';
        setHasConnection(false);
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle(defaultTitle);
    setDescription('');
    setTags('');
    setPrivacy('public');
    setUploading(false);
    setUploadProgress('');
    setUploadSuccess(false);
    setYoutubeUrl('');
  };

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-600" />
            Post to YouTube
          </DialogTitle>
          <DialogDescription>
            Upload your video clip directly to your YouTube channel
            {clipIndex !== undefined && ` (Clip ${clipIndex + 1})`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasConnection ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No YouTube account connected. Please connect your YouTube account in Settings first.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => {
                onOpenChange(false);
                // Navigate to settings - you can add navigation here if needed
              }}
              className="w-full"
            >
              Go to Settings
            </Button>
          </div>
        ) : uploadSuccess ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold">Upload Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your video has been posted to YouTube
                </p>
              </div>
              {youtubeUrl && (
                <Button
                  onClick={() => window.open(youtubeUrl, '_blank')}
                  variant="outline"
                  className="gap-2"
                >
                  <Youtube className="h-4 w-4" />
                  View on YouTube
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="Enter video title"
                maxLength={100}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                placeholder="Enter video description"
                rows={4}
                maxLength={5000}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/5000 characters
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ai, video editing, automation"
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas (max 500 characters total)
              </p>
            </div>

            {/* Privacy */}
            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy</Label>
              <Select
                value={privacy}
                onValueChange={(value: any) => setPrivacy(value)}
                disabled={uploading}
              >
                <SelectTrigger id="privacy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can view</SelectItem>
                  <SelectItem value="unlisted">Unlisted - Only people with link</SelectItem>
                  <SelectItem value="private">Private - Only you can view</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Progress */}
            {uploadProgress && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>{uploadProgress}</AlertDescription>
              </Alert>
            )}

            {/* Info */}
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Upload may take a few minutes depending on video size.
                YouTube may take additional time to process the video after upload completes.
              </AlertDescription>
            </Alert>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleClose}
                variant="outline"
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !title.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4 mr-2" />
                    Upload to YouTube
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
