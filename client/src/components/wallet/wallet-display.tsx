import { useAuth } from "@/hooks/use-auth";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Wallet } from "lucide-react";

export default function WalletDisplay() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-primary/5">
          <Wallet className="h-5 w-5" />
          <span className="font-medium">
            {user.credits} 💰 | {user.gamecoins} 🎮
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Your Wallet</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{user.credits}</p>
              <p className="text-xs text-muted-foreground">Credits</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{user.gamecoins}</p>
              <p className="text-xs text-muted-foreground">GameCoins</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Collect credits from the map or earn them by playing games. Use credits to purchase GameCoins!
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
