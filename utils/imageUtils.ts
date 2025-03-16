// utils/imageUtils.ts
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

/**
 * Helper function to pick an image from the library and upload it to Supabase storage
 */
export async function pickAndUploadImage(
  bucket: string = 'user-content',
  folder: string = 'images',
  options: {
    width?: number;
    height?: number;
    crop?: boolean;
    quality?: number;
  } = {}
): Promise<string | null> {
  try {
    // Set default options
    const {
      width = 800,
      height = 800,
      crop = true,
      quality = 0.7
    } = options;
    
    // Check for permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Permission to access media library is required');
    }
    
    // Pick the image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: crop,
      aspect: [1, 1],
      quality: 1, // We'll compress later with manipulateAsync
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    
    // Resize and compress the image
    const manipResult = await manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width, height } }],
      { format: SaveFormat.JPEG, compress: quality }
    );
    
    // Convert to base64 for upload
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        if (!reader.result) {
          reject(new Error('Failed to read image data'));
          return;
        }
        
        try {
          const base64Data = reader.result.toString();
          const base64Content = base64Data.split(',')[1];
          const contentType = base64Data.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
          
          // Generate a unique filename
          const fileExt = contentType.split('/')[1];
          const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
          const filePath = `${folder}/${fileName}`;
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, decode(base64Content), {
              contentType,
              upsert: true,
            });
            
          if (uploadError) throw uploadError;
          
          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
            
          if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error('Failed to get public URL');
          }
          
          resolve(publicUrlData.publicUrl);
        } catch (error) {
          console.error('Error uploading image:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read the file'));
      };
    });
  } catch (error) {
    console.error('Error in pickAndUploadImage:', error);
    throw error;
  }
}

/**
 * Helper function to take a photo with the camera and upload it to Supabase storage
 */
export async function takeAndUploadPhoto(
  bucket: string = 'user-content',
  folder: string = 'images',
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<string | null> {
  try {
    // Set default options
    const {
      width = 800,
      height = 800,
      quality = 0.7
    } = options;
    
    // Check for permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Permission to access camera is required');
    }
    
    // Take the photo
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // We'll compress later with manipulateAsync
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    
    // Resize and compress the image
    const manipResult = await manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width, height } }],
      { format: SaveFormat.JPEG, compress: quality }
    );
    
    // Convert to base64 for upload
    const response = await fetch(manipResult.uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        if (!reader.result) {
          reject(new Error('Failed to read image data'));
          return;
        }
        
        try {
          const base64Data = reader.result.toString();
          const base64Content = base64Data.split(',')[1];
          const contentType = base64Data.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
          
          // Generate a unique filename
          const fileExt = contentType.split('/')[1];
          const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
          const filePath = `${folder}/${fileName}`;
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, decode(base64Content), {
              contentType,
              upsert: true,
            });
            
          if (uploadError) throw uploadError;
          
          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
            
          if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error('Failed to get public URL');
          }
          
          resolve(publicUrlData.publicUrl);
        } catch (error) {
          console.error('Error uploading image:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read the file'));
      };
    });
  } catch (error) {
    console.error('Error in takeAndUploadPhoto:', error);
    throw error;
  }
}

/**
 * Delete an image from Supabase storage
 */
export async function deleteImage(
  url: string,
  bucket: string = 'user-content'
): Promise<boolean> {
  try {
    // Extract the path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');
    
    // Delete the file
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}