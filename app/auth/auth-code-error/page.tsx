export default function AuthError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p>Something went wrong during sign in. Please try again.</p>
    </div>
  );
}
