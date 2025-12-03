'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@proagenda/ui';
import { customerAuthApi } from '@proagenda/api-client';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

const magicLinkSchema = z.object({
  email: z.string().email('Email inválido'),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

interface MagicLinkFormProps {
  tenant: string;
  onSuccess?: () => void;
}

export function MagicLinkForm({ tenant, onSuccess }: MagicLinkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  });

  const onSubmit = async (data: MagicLinkFormData) => {
    setIsLoading(true);
    try {
      const response = await customerAuthApi.sendMagicLink(tenant, data.email);
      
      if (response.data.sent) {
        setEmailSent(true);
        if (response.data.devLink) {
          setDevLink(response.data.devLink);
          // Copy to clipboard
          navigator.clipboard.writeText(response.data.devLink).then(() => {
            toast.success('Link copiado para a área de transferência!', { duration: 5000 });
          });
        }
        toast.success('Link de acesso enviado! Verifique seu email.');
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar link. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Link Enviado!
          </CardTitle>
          <CardDescription>
            Enviamos um link de acesso para seu email. Verifique sua caixa de entrada e clique no link para fazer login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {devLink && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                🔗 Link de Desenvolvimento (copiado automaticamente):
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={devLink}
                  readOnly
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(devLink);
                    toast.success('Link copiado novamente!');
                  }}
                >
                  Copiar
                </Button>
              </div>
              <Button
                type="button"
                className="w-full mt-2"
                onClick={() => window.location.href = devLink}
              >
                Abrir Link Agora
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Não recebeu o email? Verifique sua pasta de spam ou{' '}
            <button
              onClick={() => {
                setEmailSent(false);
                setDevLink(null);
              }}
              className="text-primary hover:underline"
            >
              tente novamente
            </button>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login Rápido</CardTitle>
        <CardDescription>
          Digite seu email e enviaremos um link de acesso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Enviar Link de Acesso
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
