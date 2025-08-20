"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showError, showSuccess } from "@/utils/toast";
import { Company } from "@/types/database";
import { Building, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const companySchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  logo_url: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface AddEditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanySaved: () => void;
  company?: Company | null;
}

const AddEditCompanyModal = ({ isOpen, onClose, onCompanySaved, company }: AddEditCompanyModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isEditing = !!company;

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      logo_url: "",
    },
  });

  const watchedLogoUrl = form.watch("logo_url");

  useEffect(() => {
    if (isOpen) {
      if (company) {
        form.reset({
          name: company.name,
          logo_url: company.logo_url || "",
        });
        setUploadedImageUrl(company.logo_url || "");
      } else {
        form.reset({
          name: "",
          logo_url: "",
        });
        setUploadedImageUrl("");
      }
      setSelectedFile(null);
    }
  }, [isOpen, company, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        showError('Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou SVG.');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Arquivo muito grande. O tamanho máximo é 5MB.');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setUploadedImageUrl(previewUrl);
      form.setValue('logo_url', previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      showError('Erro ao fazer upload da imagem: ' + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteOldImage = async (url: string) => {
    try {
      // Extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (fileName && url.includes('supabase')) {
        await supabase.storage
          .from('company-logos')
          .remove([fileName]);
      }
    } catch (error) {
      console.error('Error deleting old image:', error);
      // Don't throw error, just log it
    }
  };

  const handleSubmit = async (values: CompanyFormValues) => {
    setIsSubmitting(true);

    try {
      let finalLogoUrl = values.logo_url;

      // Upload new image if selected
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (!uploadedUrl) {
          setIsSubmitting(false);
          return;
        }
        finalLogoUrl = uploadedUrl;

        // Delete old image if editing
        if (isEditing && company?.logo_url && company.logo_url !== uploadedUrl) {
          await deleteOldImage(company.logo_url);
        }
      }

      const companyData = {
        name: values.name,
        logo_url: finalLogoUrl || null,
      };

      if (isEditing && company) {
        const { error } = await supabase
          .from("companies")
          .update(companyData)
          .eq("id", company.id);

        if (error) throw error;
        showSuccess("Empresa atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("companies")
          .insert(companyData);

        if (error) throw error;
        showSuccess("Empresa adicionada com sucesso!");
      }

      onCompanySaved();
      onClose();
    } catch (error: any) {
      showError(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} empresa: ` + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setUploadedImageUrl("");
    form.setValue('logo_url', "");
  };

  const currentImageUrl = uploadedImageUrl || watchedLogoUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Empresa' : 'Adicionar Nova Empresa'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações da empresa.' 
              : 'Preencha os dados da nova empresa.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            {/* Preview da empresa */}
            <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentImageUrl} alt="Preview" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Building className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{form.watch("name") || "Nome da Empresa"}</p>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empresa Digital Ltda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo da Empresa</FormLabel>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Upload de Imagem</TabsTrigger>
                      <TabsTrigger value="url">URL Externa</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/svg+xml"
                          onChange={handleFileSelect}
                          className="flex-1"
                        />
                        {currentImageUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Formatos aceitos: JPEG, PNG, WebP, SVG. Tamanho máximo: 5MB.
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="url">
                      <FormControl>
                        <Input 
                          placeholder="https://exemplo.com/logo.png" 
                          type="url"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setUploadedImageUrl(e.target.value);
                            setSelectedFile(null);
                          }}
                        />
                      </FormControl>
                    </TabsContent>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Fazendo upload...
                  </>
                ) : isSubmitting ? (
                  isEditing ? "Salvando..." : "Adicionando..."
                ) : (
                  isEditing ? "Salvar Alterações" : "Adicionar Empresa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditCompanyModal;