import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import WalletDisplay from "@/components/wallet/wallet-display";
import BlockBlast from "@/components/games/block-blast";
import { useAuth } from "@/hooks/use-auth";

export default function GamePage() {
  const { logoutMutation } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost">← Torna alla Mappa</Button>
          </Link>
          <div className="flex items-center gap-4">
            <WalletDisplay />
            <Button 
              variant="ghost" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Block Blast</h1>
          <p className="text-muted-foreground mb-8">
            Posiziona i blocchi sulla griglia per formare linee complete. 
            I blocchi ✨ ti daranno crediti extra, mentre i blocchi 💎 ti faranno guadagnare GameCoin!
          </p>
          <BlockBlast />
        </div>
      </main>
    </div>
  );
}