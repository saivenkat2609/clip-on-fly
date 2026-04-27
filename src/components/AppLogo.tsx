import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_NAME } from "@/lib/config";

export function AppLogo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold">{APP_NAME}</span>
    </Link>
  );
}
