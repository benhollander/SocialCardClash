import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="max-w-sm mx-auto min-h-screen bg-white shadow-lg">
      <div className="p-6 min-h-screen flex flex-col justify-center">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎴</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Party Cards</h1>
          <p className="text-gray-600 text-lg">Find your match, do the action!</p>
        </div>
        
        <div className="space-y-4 mb-8">
          <Link href="/create">
            <Button className="w-full bg-primary text-white rounded-2xl py-4 px-6 text-lg font-semibold shadow-lg hover:bg-primary/90 active:scale-95 transition-transform">
              <i className="fas fa-plus mr-2"></i>
              Create Room
            </Button>
          </Link>
          
          <Link href="/join">
            <Button variant="outline" className="w-full bg-white border-2 border-primary text-primary rounded-2xl py-4 px-6 text-lg font-semibold shadow-lg hover:bg-primary/5 active:scale-95 transition-transform">
              <i className="fas fa-sign-in-alt mr-2"></i>
              Join Room
            </Button>
          </Link>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>Gather your friends in the same room</p>
          <p>and get ready to party! 🎉</p>
        </div>
      </div>
    </div>
  );
}
