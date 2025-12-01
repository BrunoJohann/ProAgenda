'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@proagenda/ui';
import { Calendar, Clock, Users, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

const steps = [
  { id: 1, name: 'Filial', icon: Users },
  { id: 2, name: 'Serviços', icon: Calendar },
  { id: 3, name: 'Data/Hora', icon: Clock },
  { id: 4, name: 'Confirmação', icon: CheckCircle2 },
];

export default function AgendarPage() {
  const params = useParams();
  const tenant = params.tenant as string;
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ProAgenda</span>
            <Badge variant="secondary" className="ml-2">{tenant}</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Steps Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                        currentStep >= step.id
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-white border-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium mt-2">{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-colors ${
                        currentStep > step.id ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].name}</CardTitle>
              <CardDescription>
                {currentStep === 1 && 'Selecione a unidade de atendimento'}
                {currentStep === 2 && 'Escolha os serviços desejados'}
                {currentStep === 3 && 'Selecione a data e horário'}
                {currentStep === 4 && 'Confirme seus dados'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Filial */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <Button variant="outline" className="h-auto p-6 justify-start">
                      <div className="text-left">
                        <p className="font-semibold">Filial Centro</p>
                        <p className="text-sm text-muted-foreground">Rua das Flores, 123</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto p-6 justify-start">
                      <div className="text-left">
                        <p className="font-semibold">Filial Moinhos</p>
                        <p className="text-sm text-muted-foreground">Av. dos Moinhos, 456</p>
                      </div>
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Serviços */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <Button variant="outline" className="h-auto p-4 justify-between">
                      <div className="text-left">
                        <p className="font-semibold">Corte de Cabelo</p>
                        <p className="text-sm text-muted-foreground">45 min</p>
                      </div>
                      <span className="font-semibold">R$ 50,00</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 justify-between">
                      <div className="text-left">
                        <p className="font-semibold">Barba</p>
                        <p className="text-sm text-muted-foreground">30 min</p>
                      </div>
                      <span className="font-semibold">R$ 30,00</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 justify-between">
                      <div className="text-left">
                        <p className="font-semibold">Corte + Barba</p>
                        <p className="text-sm text-muted-foreground">60 min</p>
                      </div>
                      <span className="font-semibold">R$ 70,00</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Data/Hora */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center text-muted-foreground py-8">
                    Calendário e slots disponíveis aparecerão aqui
                  </div>
                </div>
              )}

              {/* Step 4: Confirmação */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold">Resumo do Agendamento</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Filial:</span>
                        <span className="font-medium">Centro</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serviço:</span>
                        <span className="font-medium">Corte de Cabelo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">28/11/2025 às 14:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profissional:</span>
                        <span className="font-medium">João Silva</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-semibold">Total:</span>
                        <span className="font-semibold">R$ 50,00</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Seu nome"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="tel"
                      placeholder="Telefone"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="E-mail (opcional)"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={nextStep}>
              {currentStep === steps.length ? 'Confirmar Agendamento' : 'Próximo'}
              {currentStep < steps.length && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

