import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminGuardResult {
  isAdmin: boolean;
  isLoading: boolean;
  userId: string | null;
}

/**
 * Hook to verify if the current user has admin role
 * Redirects to home if not authenticated or not admin
 */
export function useAdminGuard(): AdminGuardResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!supabase) {
        setIsLoading(false);
        navigate("/");
        return;
      }

      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar autenticado para acessar esta página",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setUserId(user.id);

        // Check if user has admin role
        const { data: hasAdminRole, error: roleError } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        if (roleError) {
          console.error("Error checking admin role:", roleError);
          toast({
            title: "Erro",
            description: "Não foi possível verificar permissões",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        if (!hasAdminRole) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar o painel administrativo",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error in admin guard:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [navigate, toast]);

  return { isAdmin, isLoading, userId };
}
