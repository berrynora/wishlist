"use client";

import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/Modal/Modal";
import { Input } from "@/components/ui/Input/Input";
import { Select } from "@/components/ui/Select/Select";
import { Button } from "@/components/ui/Button/Button";

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormValues = {
  name: string;
  visibility: string;
};

export function CreateWishlistModal({ open, onClose }: Props) {
  const { register, handleSubmit, watch, setValue, reset } =
    useForm<FormValues>({
      defaultValues: {
        name: "",
        visibility: "Public",
      },
    });

  const visibility = watch("visibility");

  function onSubmit(values: FormValues) {
    console.log("Wishlist created:", values);
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Wishlist">
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "grid", gap: 16 }}
      >
        {/* Name */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "#6b7280" }}>
            Wishlist Name
          </label>

          <Input
            placeholder="Birthday 2025"
            {...register("name", { required: true })}
          />
        </div>

        {/* Visibility */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "#6b7280" }}>Visibility</label>

          <Select
            value={visibility}
            onChange={(e) => setValue("visibility", e.target.value)}
            options={["Public", "Friends only", "Private"]}
          />
        </div>

        {/* Buttons */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit">Create</Button>
        </div>
      </form>
    </Modal>
  );
}
