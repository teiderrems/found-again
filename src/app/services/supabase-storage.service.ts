import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
   providedIn: 'root',
})
export class SupabaseStorageService {
   private supabase: SupabaseClient;
   private bucket = 'images';
   private path = 'objects';
   private supabase_path = 'https://nmthllukseagzmmhpvlb.supabase.co';

   constructor() {
      this.supabase = createClient(
         this.supabase_path,
         'sb_publishable_Edm6eRUIi012HRvwbVCiag_XZFJJpQ5',
      );
   }

   // Upload des fichiers
   async uploadFiles(files: File[]) {
      const paths = await Promise.all(
         files.map(async (file) => {
            const { data, error } = await this.supabase.storage
               .from(this.bucket)
               .upload(this.path, file, {
                  upsert: true,
                  metadata:{
                    filename:file.name,
                    minetype:file.type,
                    size:file.size
                  }
               });
            if (error) throw error;
            return this.getPublicUrl(data.path);
         }),
      );
      return paths;
   }

   // Récupérer l’URL publique
   getPublicUrl( path: string) {
      const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
      return data.publicUrl;
   }

   private getPaths(paths:string[]){
    return paths.map(p=>`public/${p.split("public")[1]}`);
   }

   // Supprimer un fichier
   async deleteFiles(paths: string[]) {
      const { error } = await this.supabase.storage.from(this.bucket).remove(this.getPaths(paths));
      if (error) throw error;
   }
}
