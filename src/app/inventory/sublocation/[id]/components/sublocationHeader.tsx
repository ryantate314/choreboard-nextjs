"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, Tag, X } from "lucide-react";
import { Sublocation } from "../../../../models/inventory";
import {
  uploadSublocationPhoto,
  deleteSublocationPhoto,
} from "../../../../actions/inventory";
import { Button } from "@/components/ui/button";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface Props {
  sublocation: Sublocation;
}

export default function SublocationHeader({ sublocation }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("id", sublocation.id.toString());
      formData.set("file", file);
      await uploadSublocationPhoto(formData);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeletePhoto() {
    await deleteSublocationPhoto(sublocation.id);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-3">
        <Link href="/inventory" className="hover:text-gray-200">
          Inventory
        </Link>
        <span className="mx-1">&rsaquo;</span>
        <Link
          href={`/inventory?loc=${sublocation.location?.id}`}
          className="hover:text-gray-200"
        >
          {sublocation.location?.name}
        </Link>
        <span className="mx-1">&rsaquo;</span>
        <span className="text-gray-200">{sublocation.name}</span>
      </nav>

      <div className="flex gap-6">
        {/* Left: title + buttons */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4">{sublocation.name}</h1>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera />
              {uploading
                ? "Uploading..."
                : sublocation.photoPath
                  ? "Replace Photo"
                  : "Take/Upload Photo"}
            </Button>
            <Button variant="secondary" size="sm" disabled>
              <Tag />
              Generate Label
            </Button>
          </div>
        </div>

        {/* Right: photo */}
        {sublocation.photoPath && (
          <div className="relative flex-shrink-0">
            <img
              src={`${basePath}/api/uploads/${sublocation.photoPath}`}
              alt={`Photo of ${sublocation.name}`}
              className="w-48 h-36 object-cover rounded-lg"
            />
            <button
              onClick={handleDeletePhoto}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-1 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
