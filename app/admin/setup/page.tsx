import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY!;

export default async function SetupPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/admin/setup');
  }

  const userEmail = session.user.email;
  let result = { success: false, message: '', error: null as any };

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingUser) {
      // Update existing user to admin
      const { data, error } = await supabase
        .from('users')
        .update({ 
          role: 'admin', 
          is_active: true,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', userEmail)
        .select()
        .single();

      if (error) throw error;

      result = {
        success: true,
        message: `✅ User "${userEmail}" updated to admin role`,
        error: null
      };
    } else {
      // Create new admin user
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          name: session.user.name || 'Admin User',
          role: 'admin',
          is_active: true,
          last_login: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      result = {
        success: true,
        message: `✅ Admin user created for "${userEmail}"`,
        error: null
      };
    }
  } catch (error) {
    result = {
      success: false,
      message: '❌ Error setting up admin user',
      error: error
    };
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Admin Setup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Grant admin permissions to your account
          </p>
        </div>
        
        <div className={`rounded-md p-4 ${result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {result.success ? (
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {result.message}
              </h3>
              {result.error && (
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {result.success && (
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              You can now create and manage blog posts!
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="/admin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Admin Dashboard
              </a>
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Status
              </button>
            </div>
          </div>
        )}

        {!result.success && (
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Something went wrong. Please check that:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Supabase is properly configured</li>
              <li>The users table exists</li>
              <li>You have run the database migrations</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
