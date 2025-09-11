import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Moon, Sun } from "lucide-react";

export default function Config() {
  const [darkMode, setDarkMode] = useState(false);
  const [defaultUf, setDefaultUf] = useState("");
  const [defaultRegime, setDefaultRegime] = useState("");
  const [defaultDestino, setDefaultDestino] = useState("");
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
              <Label htmlFor="default-uf">UF Padrão</Label>
              <Select value={defaultUf} onValueChange={setDefaultUf}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sp">SP - São Paulo</SelectItem>
                  <SelectItem value="rj">RJ - Rio de Janeiro</SelectItem>
                  <SelectItem value="mg">MG - Minas Gerais</SelectItem>
                  <SelectItem value="pr">PR - Paraná</SelectItem>
                  <SelectItem value="rs">RS - Rio Grande do Sul</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-regime">Regime Tributário</Label>
              <Select value={defaultRegime} onValueChange={setDefaultRegime}>
                <SelectTrigger>
                  <SelectValue placeholder="Seu regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Regime Normal</SelectItem>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-destino">Destinação Padrão</Label>
              <Select value={defaultDestino} onValueChange={setDefaultDestino}>
                <SelectTrigger>
                  <SelectValue placeholder="Finalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - Refeição</SelectItem>
                  <SelectItem value="B">B - Revenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interface Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Aparência e Interface</CardTitle>
          <CardDescription>
            Personalize a experiência visual do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Tema Escuro</Label>
              <p className="text-sm text-muted-foreground">
                Ativar modo escuro para reduzir o cansaço visual
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
              <Label htmlFor="auto-calculate">Cálculo Automático</Label>
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
              Regime: {defaultRegime || "Não definido"}
            </Badge>
            <Badge variant={defaultDestino ? "success" : "secondary"}>
              Destinação: {defaultDestino || "Não definida"}
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