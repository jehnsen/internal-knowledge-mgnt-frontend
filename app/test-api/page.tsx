"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TestAPIPage() {
  const [username, setUsername] = useState("tony");
  const [password, setPassword] = useState("ironman");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const testLogin = async () => {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', 'password');

      console.log('Sending request to:', `${API_URL}/api/v1/auth/login`);
      console.log('Form data:', formData.toString());

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        setError(`Error ${response.status}: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error('Request failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testRegister = async () => {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: `${username}@test.com`,
          password: password,
          full_name: username.charAt(0).toUpperCase() + username.slice(1)
        })
      });

      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        setError(`Error ${response.status}: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error('Request failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testDocs = async () => {
    window.open(`${API_URL}/api/docs`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>API URL</Label>
              <Input value={API_URL} disabled />
            </div>

            <div>
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={testRegister} disabled={isLoading}>
                1. Register User
              </Button>
              <Button onClick={testLogin} disabled={isLoading} variant="default">
                2. Test Login
              </Button>
              <Button onClick={testDocs} variant="outline">
                View API Docs
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <pre className="text-xs overflow-auto">{error}</pre>
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Success Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto bg-muted p-4 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Login Request</Label>
              <pre className="text-xs overflow-auto bg-muted p-4 rounded mt-2">
{`POST ${API_URL}/api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=${username}&password=${password}&grant_type=password`}
              </pre>
            </div>

            <div>
              <Label className="text-sm font-semibold">Register Request</Label>
              <pre className="text-xs overflow-auto bg-muted p-4 rounded mt-2">
{`POST ${API_URL}/api/v1/auth/register
Content-Type: application/json

{
  "username": "${username}",
  "email": "${username}@test.com",
  "password": "${password}",
  "full_name": "${username.charAt(0).toUpperCase() + username.slice(1)}"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Make sure backend is running at <code className="bg-muted px-1">{API_URL}</code></li>
              <li>Click "View API Docs" to check available endpoints</li>
              <li>Try "Register User" first to create the user</li>
              <li>Then try "Test Login" with the same credentials</li>
              <li>Check browser console (F12) for detailed logs</li>
              <li>Check backend logs for error messages</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
