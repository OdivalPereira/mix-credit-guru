import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Moon, Sun } from "lucide-react";
import { ESTADOS } from "@/data/locations";
import { DESTINO_OPTIONS, DESTINO_LABELS, REGIME_OPTIONS, REGIME_LABELS } from "@/data/lookups";
import type { DestinoTipo, SupplierRegime } from "@/types/domain";

export default function Config() {
  const [darkMode, setDarkMode] = useState(false);
  const [defaultUf, setDefaultUf] = useState("");
  const [defaultRegime, setDefaultRegime] = useState<SupplierRegime | "">("");
  const [defaultDestino, setDefaultDestino] = useState<DestinoTipo | "">("");
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Personalize o sistema com suas preferências padrão
        </p>
      </div>

      {/* Default Values */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Valores Padrão
          </CardTitle>
          <CardDescription>
            Configure valores que serão preenchidos automaticamente nas cotações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-uf">UF Padrao</Label>
              <Select value={defaultUf} onValueChange={(value) => setDefaultUf(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((estado) => (
                    <SelectItem key={estado.sigla} value={estado.sigla}>
                      {estado.sigla} - {estado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-regime">Regime Tributário</Label>
              <Select value={defaultRegime} onValueChange={(value) => setDefaultRegime(value as SupplierRegime)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seu regime" />
                </SelectTrigger>
                <SelectContent>
                  {REGIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-destino">Destinacao Padrao</Label>
              <Select value={defaultDestino} onValueChange={(value) => setDefaultDestino(value as DestinoTipo)}>
                <SelectTrigger>
                  <SelectValue placeholder="Finalidade" />
                </SelectTrigger>
                <SelectContent>
                  {DESTINO_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      textValue={`${option.value} - ${option.label}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {option.value} - {option.label}
                        </span>
                        {option.description ? (
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interface Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Aparencia e Interface</CardTitle>
          <CardDescription>
            Personalize a experiencia visual do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Tema Escuro</Label>
              <p className="text-sm text-muted-foreground">
                Ativar modo escuro para reduzir o cansaco visual
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4" />
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tooltips">Tooltips Explicativos</Label>
              <p className="text-sm text-muted-foreground">
                Mostrar dicas e explicações ao passar o mouse sobre elementos
              </p>
            </div>
            <Switch
              id="tooltips"
              checked={showTooltips}
              onCheckedChange={setShowTooltips}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Comportamento do Sistema</CardTitle>
          <CardDescription>
            Configure como o sistema deve se comportar durante o uso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-calculate">Calculo Automatico</Label>
              <p className="text-sm text-muted-foreground">
                Recalcular automaticamente os custos efetivos ao alterar dados
              </p>
            </div>
            <Switch
              id="auto-calculate"
              checked={autoCalculate}
              onCheckedChange={setAutoCalculate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant={defaultUf ? "success" : "secondary"}>
              UF: {defaultUf ? defaultUf.toUpperCase() : "Não definido"}
            </Badge>
            <Badge variant={defaultRegime ? "success" : "secondary"}>
              Regime: {defaultRegime ? REGIME_LABELS[defaultRegime] ?? defaultRegime : "Não definido"}
            </Badge>
            <Badge variant={defaultDestino ? "success" : "secondary"}>
              Destinação: {defaultDestino ? `${defaultDestino} - ${DESTINO_LABELS[defaultDestino] ?? ""}`.trim() : "Não definida"}
            </Badge>
            <Badge variant={darkMode ? "default" : "secondary"}>
              Tema: {darkMode ? "Escuro" : "Claro"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" className="min-w-[120px]">
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
