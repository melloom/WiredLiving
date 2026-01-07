import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'About',
  description: 'Full-Stack Developer • AI Integrator • Builder of Bold Ideas',
  openGraph: {
    title: `About | ${siteConfig.name}`,
    description: 'Full-Stack Developer • AI Integrator • Builder of Bold Ideas',
    ...(siteConfig.url && { url: `${siteConfig.url}/about` }),
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border border-blue-500/30 dark:border-blue-400/30 rounded-full">
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  Full-Stack Developer • AI Integrator
                </span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Hey, I&apos;m Melvin
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              aka <span className="text-blue-600 dark:text-blue-400">Melhub</span>
            </p>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              I&apos;m a solo developer who codes with vision, vibes, and velocity.
              Whether it&apos;s shipping SaaS tools, crafting AI-powered apps, or hacking together games 
              that spark curiosity — I build fast, break limits, and learn even faster.
            </p>
          </div>

          {/* What I Build */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">🚀 What I Build</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg">
                <div className="text-3xl mb-4">🔮</div>
                <h3 className="text-xl font-semibold mb-2">AI Tools</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Dream interpreters, content generators, social AI assistants
                </p>
              </div>
              
              <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg">
                <div className="text-3xl mb-4">🧩</div>
                <h3 className="text-xl font-semibold mb-2">SaaS Apps</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automation-first tools that solve real problems
                </p>
              </div>
              
              <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg">
                <div className="text-3xl mb-4">🎮</div>
                <h3 className="text-xl font-semibold mb-2">Games</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Experimental games with dark twists and survival mechanics
                </p>
              </div>
              
              <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg">
                <div className="text-3xl mb-4">🧠</div>
                <h3 className="text-xl font-semibold mb-2">Vibe Coding</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  I architect apps using AI as my co-pilot. It&apos;s not just coding — it&apos;s orchestration.
                </p>
              </div>
            </div>
          </section>

          {/* Featured Projects */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">🧵 Featured Projects</h2>
            <div className="space-y-6">
              <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🧠</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">Dream Interpreter & Manifestation Coach</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      NLP-powered dream decoding + daily affirmations. A spiritual tech blend for the TikTok generation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🤖</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">AI Caption Generator</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Automates social media captions with trend-aware GPT prompts and style presets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 rounded-xl border border-gray-700 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🕹️</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 text-white">Would You Rather: Survival Edition</h3>
                    <p className="text-gray-300 mb-4">
                      A dark, eerie decision game where every round gets creepier and harder to survive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Connect Section */}
          <section className="text-center">
            <h2 className="text-3xl font-bold mb-8">📫 Let&apos;s Connect</h2>
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="text-2xl mb-3">🌐</div>
                <h3 className="text-xl font-semibold mb-2">Portfolio</h3>
                <a
                  href={siteConfig.links.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-lg"
                >
                  www.mellowsites.com
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Peek into my projects, past work, and creative builds.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="text-2xl mb-3">🔗</div>
                <h3 className="text-xl font-semibold mb-2">Socials Hub</h3>
                <a
                  href={siteConfig.links.socialHub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-lg"
                >
                  melhub.netlify.app
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  One link to find them all — GitHub, Twitter, YouTube, LinkedIn, and more.
                </p>
              </div>

              <div className="pt-6">
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  💬 Always open to collabs, freelancing, or just a good dev chat.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

