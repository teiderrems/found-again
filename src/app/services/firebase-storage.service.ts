import { Injectable } from '@angular/core';
import { getStorage, ref, uploadBytes,deleteObject, getDownloadURL } from 'firebase/storage';

import { v4 as uuid } from 'uuid';
import { ImageType } from '../types/declaration';

@Injectable({
   providedIn: 'root',
})
export class FirebaseStorageService {
   private path = 'images';

   // Upload des fichiers
   async uploadFiles(files: File[],otherPath?: string): Promise<ImageType[]> {
      const storage = getStorage();
      
      const paths = await Promise.all(
         files.map(async (file) => {
            try {
               const storageRef = ref(storage, `${this.path}/${otherPath}/${uuid()}`);
               const response = await uploadBytes(storageRef, file);
               return {
                  fullPath: response.metadata.fullPath,
                  downloadURL: await getDownloadURL(response.ref),
               };
            } catch (error) {
               throw error;
            }
         }),
      );
      return paths;
   }

   // Supprimer un fichier
   async deleteFiles(paths: ImageType[]) {
      const storage = getStorage();
      const storageRefs = paths.map((path) => ref(storage, path.fullPath));
      try {
         await Promise.all(
            storageRefs.map(async (storageRef) => {
               await deleteObject(storageRef);
            }),
         );
      } catch (error) {
         throw error;
      }
   }
}
