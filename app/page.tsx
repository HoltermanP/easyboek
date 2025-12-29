import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, Sparkles, Shield, Zap, FileText, Calculator, Clock } from "lucide-react";
import Link from "next/link";
import { ReviewsCarousel } from "@/components/reviews/ReviewsCarousel";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-foreground">EasyBoek</div>
          <div className="flex gap-4">
            <Link href="/sign-in">
              <Button variant="outline">Inloggen</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Start nu</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4" variant="secondary">
          Volledige ontzorging voor ZZP&apos;ers
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
          Boekhouden zonder gedoe
          <br />
          <span className="text-muted-foreground">Laat AI het werk doen</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Upload je bonnen en facturen, wij regelen de rest. Automatische boekingen, 
          BTW-berekeningen en belastingaangiftes. Focus op je werk, niet op je administratie.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8">
              Start gratis proefperiode
            </Button>
          </Link>
          <Link href="#pricing">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Bekijk functies
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          Alles wat je nodig hebt voor je administratie
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <FileText className="w-10 h-10 text-blue-500 mb-2" />
              <CardTitle>Automatische verwerking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Upload bonnen en facturen, AI verwerkt ze automatisch en koppelt ze aan de juiste categorieën.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calculator className="w-10 h-10 text-green-500 mb-2" />
              <CardTitle>BTW automatisch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automatische BTW-berekeningen per kwartaal. Altijd klaar voor je belastingaangifte.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-purple-500 mb-2" />
              <CardTitle>Volledig grootboek</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Professioneel double-entry boekhoudsysteem. Altijd inzicht in je financiën.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="w-10 h-10 text-orange-500 mb-2" />
              <CardTitle>Bespaar tijd</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Geen uren meer kwijt aan administratie. Focus op wat je het beste doet: je werk.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewsCarousel />

      {/* Features Section - Pricing is uitgeschakeld */}
      <section id="pricing" className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Gratis te gebruiken</h2>
          <p className="text-muted-foreground">Maak een gratis account aan en begin direct</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Basis Pakket */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Basis</CardTitle>
              <CardDescription>Voor zelfstandigen die zelf de controle willen houden</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€29,95</span>
                <span className="text-muted-foreground">/maand</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Per jaar afgenomen</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Alle standaard boekhoudfuncties</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Double-entry grootboek</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>BTW-berekeningen per kwartaal</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Facturatie en klantenbeheer</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Rapportages en overzichten</span>
                </li>
                <Separator className="my-3" />
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Handmatige koppeling van boekingen</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Extra checks nodig voor belastingaangiftes</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Geen AI-ondersteuning</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/sign-up?plan=basis" className="w-full">
                <Button variant="outline" className="w-full">
                  Kies Basis
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Premium Pakket */}
          <Card className="relative border-2 border-primary">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">
                Meest populair
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Premium
                <Sparkles className="w-5 h-5 text-primary" />
              </CardTitle>
              <CardDescription>Volledig ontzorgd met AI en ondersteuning</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">€39,95</span>
                  <span className="text-muted-foreground">/maand</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-muted-foreground line-through">€49,95</span>
                  <Badge variant="secondary" className="ml-2">
                    Eerste 6 maanden
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Daarna €49,95/maand • Per jaar afgenomen</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Alles uit Basis pakket</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">AI-automatisering van boekingen</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Automatische koppeling van documenten</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Alleen bonnen, facturen en uren invoeren</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">De rest wordt geregeld</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Persoonlijke ondersteuning</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Geen extra checks nodig voor belastingaangiftes</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/sign-up?plan=premium" className="w-full">
                <Button className="w-full">
                  Kies Premium
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Klaar om te beginnen?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Start vandaag nog en ervaar hoe eenvoudig boekhouden kan zijn.
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="text-lg px-8">
            Start nu
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">EasyBoek</h3>
              <p className="text-muted-foreground text-sm">
                De eenvoudigste manier om je administratie bij te houden.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Functies</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Start nu</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/settings" className="hover:text-foreground transition-colors">Instellingen</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} EasyBoek. Alle rechten voorbehouden.
          </p>
        </div>
      </footer>
    </div>
  );
}



