import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebaseGame } from '@/hooks/use-firebase-game';
import { useLocation } from 'wouter';

export default function FirebaseSetup() {
  const [, setLocation] = useLocation();
  const { initialize, error } = useFirebaseGame();
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Save config to localStorage for future use
    localStorage.setItem('firebase-config', JSON.stringify(config));

    const success = initialize(config);
    setIsLoading(false);

    if (success) {
      setLocation('/');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const loadSampleConfig = () => {
    setConfig({
      apiKey: 'your-api-key-here',
      authDomain: 'your-project.firebaseapp.com',
      databaseURL: 'https://your-project-default-rtdb.firebaseio.com/',
      projectId: 'your-project',
      storageBucket: 'your-project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef123456'
    });
  };

  // Try to load saved config on mount
  useState(() => {
    const saved = localStorage.getItem('firebase-config');
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Failed to parse saved Firebase config');
      }
    }
  });

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-background shadow-lg">
      <div className="p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Firebase Setup</h1>
          <p className="text-muted-foreground">Configure Firebase for cross-device multiplayer</p>
        </div>

        <div className="bg-card rounded-2xl p-6 mb-6 border border-border">
          <h3 className="font-semibold text-card-foreground mb-3">Quick Setup Guide:</h3>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li>1. Go to <a href="https://console.firebase.google.com" target="_blank" className="text-primary underline">Firebase Console</a></li>
            <li>2. Create a new project or select existing</li>
            <li>3. Enable "Realtime Database"</li>
            <li>4. Set database rules to public for testing:</li>
            <li className="ml-4 bg-muted p-2 rounded text-xs font-mono">
              {`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
            </li>
            <li>5. Go to Project Settings → General → Your apps</li>
            <li>6. Add web app and copy the config below</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="text"
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder="AIza..."
              required
            />
          </div>

          <div>
            <Label htmlFor="authDomain">Auth Domain</Label>
            <Input
              id="authDomain"
              type="text"
              value={config.authDomain}
              onChange={(e) => handleInputChange('authDomain', e.target.value)}
              placeholder="your-project.firebaseapp.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="databaseURL">Database URL</Label>
            <Input
              id="databaseURL"
              type="text"
              value={config.databaseURL}
              onChange={(e) => handleInputChange('databaseURL', e.target.value)}
              placeholder="https://your-project-default-rtdb.firebaseio.com/"
              required
            />
          </div>

          <div>
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              type="text"
              value={config.projectId}
              onChange={(e) => handleInputChange('projectId', e.target.value)}
              placeholder="your-project"
              required
            />
          </div>

          <div>
            <Label htmlFor="storageBucket">Storage Bucket</Label>
            <Input
              id="storageBucket"
              type="text"
              value={config.storageBucket}
              onChange={(e) => handleInputChange('storageBucket', e.target.value)}
              placeholder="your-project.appspot.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
            <Input
              id="messagingSenderId"
              type="text"
              value={config.messagingSenderId}
              onChange={(e) => handleInputChange('messagingSenderId', e.target.value)}
              placeholder="123456789"
              required
            />
          </div>

          <div>
            <Label htmlFor="appId">App ID</Label>
            <Input
              id="appId"
              type="text"
              value={config.appId}
              onChange={(e) => handleInputChange('appId', e.target.value)}
              placeholder="1:123456789:web:abcdef123456"
              required
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-3 px-6 text-lg font-semibold"
            >
              {isLoading ? 'Connecting...' : 'Connect to Firebase'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={loadSampleConfig}
              className="w-full rounded-2xl py-3 px-6 text-lg font-semibold"
            >
              Load Sample Config
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/')}
              className="w-full rounded-2xl py-3 px-6 text-lg font-semibold"
            >
              Skip (Use Local Mode)
            </Button>
          </div>
        </form>

        <div className="mt-6 bg-card rounded-2xl p-4 border border-border">
          <h4 className="font-semibold text-card-foreground mb-2">Alternative Options:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Local Mode</strong>: Single device multiplayer (skip setup)</li>
            <li>• <strong>PeerJS</strong>: Direct device connections (no setup needed)</li>
            <li>• <strong>Supabase</strong>: Firebase alternative with PostgreSQL</li>
          </ul>
        </div>
      </div>
    </div>
  );
}