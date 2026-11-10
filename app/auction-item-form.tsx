"use client";

import { useEffect, useRef, useState } from "react";

type ItemCategory = "other" | "stallion_breeding";
type ItemStatus = "draft" | "published";

export type AuctionItemFormValues = {
  title: string;
  description: string;
  retailValue: string;
  startingBid: string;
  bidIncrement: string;
  category: ItemCategory;
  donorName: string;
  donorWebsite: string;
  breedingDetails: string;
  status: ItemStatus;
};

type AuctionItemFormProps = {
  initialItem?: AuctionItemFormValues;
};

type AuctionSettings = {
  name: string;
  biddingStartsAtEastern: string;
  biddingEndsAtEastern: string;
};

type ItemPhoto = {
  file: File;
  previewUrl: string;
};

const AUCTION_TIME_ZONE = "America/New_York";
const MAX_PHOTOS = 10;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const easternDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: AUCTION_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const emptyItem: AuctionItemFormValues = {
  title: "",
  description: "",
  retailValue: "",
  startingBid: "",
  bidIncrement: "25",
  category: "other",
  donorName: "",
  donorWebsite: "",
  breedingDetails: "",
  status: "draft",
};

const emptyAuctionSettings: AuctionSettings = {
  name: "",
  biddingStartsAtEastern: "",
  biddingEndsAtEastern: "",
};

const fieldClassName =
  "mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-500 focus-visible:border-stone-950 focus-visible:ring-2 focus-visible:ring-stone-950/25";

const labelClassName = "block text-sm font-medium text-stone-800";

function easternDateTimeToUtc(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const wallTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const wallDate = new Date(wallTimeAsUtc);

  if (
    wallDate.getUTCFullYear() !== year ||
    wallDate.getUTCMonth() !== month - 1 ||
    wallDate.getUTCDate() !== day ||
    wallDate.getUTCHours() !== hour ||
    wallDate.getUTCMinutes() !== minute
  ) {
    return null;
  }

  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sampleTime = wallTimeAsUtc + hours * 60 * 60 * 1000;
    const parts = easternDateTimeFormatter.formatToParts(new Date(sampleTime));
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    const easternAsUtc = Date.UTC(
      getPart("year"),
      getPart("month") - 1,
      getPart("day"),
      getPart("hour"),
      getPart("minute"),
    );
    offsets.add(easternAsUtc - sampleTime);
  }

  const matchingTimes = [...offsets]
    .map((offset) => wallTimeAsUtc - offset)
    .filter((timestamp) => {
      const parts = easternDateTimeFormatter.formatToParts(new Date(timestamp));
      const getPart = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value);

      return (
        getPart("year") === year &&
        getPart("month") === month &&
        getPart("day") === day &&
        getPart("hour") === hour &&
        getPart("minute") === minute
      );
    });

  if (matchingTimes.length !== 1) return null;
  return new Date(matchingTimes[0]).toISOString();
}

export default function AuctionItemForm({
  initialItem,
}: AuctionItemFormProps) {
  const [item, setItem] = useState<AuctionItemFormValues>(
    () => initialItem ?? emptyItem,
  );
  const [auctionSettings, setAuctionSettings] = useState<AuctionSettings>(
    emptyAuctionSettings,
  );
  const [photos, setPhotos] = useState<ItemPhoto[]>([]);
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const objectUrls = useRef(new Set<string>());
  const biddingStartInput = useRef<HTMLInputElement>(null);
  const biddingEndInput = useRef<HTMLInputElement>(null);
  const biddingStartsAtUtc = easternDateTimeToUtc(
    auctionSettings.biddingStartsAtEastern,
  );
  const biddingEndsAtUtc = easternDateTimeToUtc(
    auctionSettings.biddingEndsAtEastern,
  );
  const invalidEasternDateTimeMessage =
    "Enter a valid, unambiguous date and time in Eastern Time.";
  const biddingStartError =
    auctionSettings.biddingStartsAtEastern && !biddingStartsAtUtc
      ? invalidEasternDateTimeMessage
      : "";
  const biddingEndError =
    auctionSettings.biddingEndsAtEastern && !biddingEndsAtUtc
      ? invalidEasternDateTimeMessage
      : biddingStartsAtUtc &&
          biddingEndsAtUtc &&
          biddingEndsAtUtc <= biddingStartsAtUtc
        ? "The bidding end must be after the bidding start."
        : "";

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    biddingStartInput.current?.setCustomValidity(biddingStartError);
  }, [biddingStartError]);

  useEffect(() => {
    biddingEndInput.current?.setCustomValidity(biddingEndError);
  }, [biddingEndError]);

  function updateAuctionSetting<Field extends keyof AuctionSettings>(
    field: Field,
    value: AuctionSettings[Field],
  ) {
    setAuctionSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  }

  function updateField<Field extends keyof AuctionItemFormValues>(
    field: Field,
    value: AuctionItemFormValues[Field],
  ) {
    setItem((currentItem) => ({ ...currentItem, [field]: value }));
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;

    const selectedFiles = Array.from(files);
    const newPhotos: ItemPhoto[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      if (!ACCEPTED_PHOTO_TYPES.has(file.type.toLowerCase())) {
        errors.push(`${file.name}: Choose a JPEG, PNG, or WebP image.`);
        continue;
      }

      if (file.size > MAX_PHOTO_SIZE) {
        errors.push(`${file.name}: The file is larger than 10 MB.`);
        continue;
      }

      if (photos.length + newPhotos.length >= MAX_PHOTOS) {
        errors.push(`${file.name}: You can add up to ${MAX_PHOTOS} photos.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      newPhotos.push({ file, previewUrl });
    }

    if (newPhotos.length > 0) {
      setPhotos((currentPhotos) => [...currentPhotos, ...newPhotos]);
    }
    setPhotoErrors(errors);
  }

  function removePhoto(previewUrl: string) {
    URL.revokeObjectURL(previewUrl);
    objectUrls.current.delete(previewUrl);
    setPhotos((currentPhotos) =>
      currentPhotos.filter((photo) => photo.previewUrl !== previewUrl),
    );
  }

  function movePhoto(index: number, direction: -1 | 1) {
    setPhotos((currentPhotos) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= currentPhotos.length) {
        return currentPhotos;
      }

      const reorderedPhotos = [...currentPhotos];
      [reorderedPhotos[index], reorderedPhotos[nextIndex]] = [
        reorderedPhotos[nextIndex],
        reorderedPhotos[index],
      ];
      return reorderedPhotos;
    });
  }

  return (
    <div>
      <div className="mb-7 overflow-hidden rounded-xl bg-stone-950 text-white shadow-sm">
        <div className="border-b border-stone-700 px-5 py-4 sm:px-7">
          <p className="font-serif text-xl font-semibold tracking-wide">
            New Horizons
          </p>
          <p className="mt-1 text-xs tracking-wide text-stone-300">
            Annual auction · Item preparation
          </p>
        </div>
      </div>
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Prepare your auction items
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-700">
          Add photos, share the details, and set the bidding amounts for each
          donated item.
        </p>
      </header>

      <form
        className="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-md shadow-stone-900/5"
        onSubmit={(event) => event.preventDefault()}
      >
        <section
          aria-labelledby="item-details-heading"
          className="space-y-6 p-5 sm:p-8"
        >
          <div>
            <h2
              className="font-serif text-xl font-semibold text-stone-950"
              id="item-details-heading"
            >
              Item details
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-700">
              Tell bidders what makes this donated item special.
            </p>
          </div>

          <div>
            <label className={labelClassName} htmlFor="title">
              Item title <span className="text-rose-700">*</span>
            </label>
            <input
              autoComplete="off"
              className={fieldClassName}
              id="title"
              name="title"
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="For example, Leather western saddle"
              required
              value={item.title}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="description">
              Description <span className="text-rose-700">*</span>
            </label>
            <textarea
              className={fieldClassName}
              id="description"
              name="description"
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Share the details bidders will want to know."
              required
              rows={4}
              value={item.description}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="category">
              Category
            </label>
            <select
              className={fieldClassName}
              id="category"
              name="category"
              onChange={(event) => {
                if (
                  event.target.value === "other" ||
                  event.target.value === "stallion_breeding"
                ) {
                  updateField("category", event.target.value);
                }
              }}
              value={item.category}
            >
              <option value="other">Other item</option>
              <option value="stallion_breeding">Stallion breeding</option>
            </select>
          </div>

          {item.category === "stallion_breeding" && (
            <div>
              <label className={labelClassName} htmlFor="breedingDetails">
                Breeding details{" "}
                <span className="font-normal text-stone-500">(optional)</span>
              </label>
              <textarea
                aria-describedby="breeding-details-help"
                className={fieldClassName}
                id="breedingDetails"
                name="breedingDetails"
                onChange={(event) =>
                  updateField("breedingDetails", event.target.value)
                }
                placeholder="Add breeding terms bidders should know."
                rows={3}
                value={item.breedingDetails}
              />
              <p
                className="mt-2 text-sm leading-6 text-stone-700"
                id="breeding-details-help"
              >
                Include the breeding year, any restrictions, and additional
                fees.
              </p>
            </div>
          )}

          <div className="max-w-sm">
            <label className={labelClassName} htmlFor="status">
              Item status
            </label>
            <select
              className={fieldClassName}
              id="status"
              name="status"
              onChange={(event) => {
                if (
                  event.target.value === "draft" ||
                  event.target.value === "published"
                ) {
                  updateField("status", event.target.value);
                }
              }}
              value={item.status}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              Choose whether this item is still a draft or ready to be shown to
              bidders.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="photos-heading"
          className="space-y-6 border-t border-stone-200 p-5 sm:p-8"
        >
          <div>
            <h2
              className="font-serif text-xl font-semibold text-stone-950"
              id="photos-heading"
            >
              Photos{" "}
              <span className="font-normal text-stone-500">(optional)</span>
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-700">
              Add up to {MAX_PHOTOS} photos (JPEG, PNG, or WebP; 10 MB each).
              The first photo will be the cover. You can preview and arrange
              your photos here.
            </p>
          </div>

          <div>
            <label className={labelClassName} htmlFor="itemPhotos">
              Choose photos
            </label>
            <input
              accept="image/jpeg,image/png,image/webp"
              className={`${fieldClassName} file:mr-3 file:rounded-md file:border-0 file:bg-stone-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white`}
              id="itemPhotos"
              multiple
              onChange={(event) => {
                addPhotos(event.target.files);
                event.target.value = "";
              }}
              type="file"
            />
            <p className="mt-2 text-sm text-stone-700" id="photo-count">
              {photos.length} of {MAX_PHOTOS} photos selected
            </p>
          </div>

          {photoErrors.length > 0 && (
            <ul
              aria-live="assertive"
              className="list-inside list-disc space-y-1 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              role="alert"
            >
              {photoErrors.map((error, index) => (
                <li key={`${error}-${index}`}>{error}</li>
              ))}
            </ul>
          )}

          {photos.length > 0 && (
            <ol
              aria-label="Selected photos in display order"
              className="grid gap-4 sm:grid-cols-2"
            >
              {photos.map((photo, index) => (
                <li
                  className="overflow-hidden rounded-xl border border-stone-200 bg-white"
                  key={photo.previewUrl}
                >
                  <div className="relative aspect-[4/3] bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Preview of ${photo.file.name}`}
                      className="h-full w-full object-cover"
                      src={photo.previewUrl}
                    />
                    {index === 0 && (
                      <span className="absolute left-3 top-3 rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">
                        Cover photo
                      </span>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="truncate text-sm font-medium text-stone-800">
                      {photo.file.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        aria-label={`Move ${photo.file.name} earlier`}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium text-stone-800 transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={index === 0}
                        onClick={() => movePhoto(index, -1)}
                        type="button"
                      >
                        Move earlier
                      </button>
                      <button
                        aria-label={`Move ${photo.file.name} later`}
                        className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium text-stone-800 transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={index === photos.length - 1}
                        onClick={() => movePhoto(index, 1)}
                        type="button"
                      >
                        Move later
                      </button>
                      <button
                        aria-label={`Remove ${photo.file.name}`}
                        className="min-h-10 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-800 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                        onClick={() => removePhoto(photo.previewUrl)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section
          aria-labelledby="bidding-heading"
          className="space-y-6 border-t border-stone-200 p-5 sm:p-8"
        >
          <div>
            <h2
              className="font-serif text-xl font-semibold text-stone-950"
              id="bidding-heading"
            >
              Value and bidding
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-700">
              Add the auction schedule and set clear starting amounts for
              bidders.
            </p>
          </div>

          <div className="space-y-5 rounded-lg bg-stone-100 p-4 sm:p-5">
            <div>
              <h3 className="text-base font-semibold text-stone-950">
                Auction details
              </h3>
              <p className="mt-1 text-sm leading-6 text-stone-700">
                Enter the auction name and confirmed bidding dates and times.
                All times are Eastern Time.
              </p>
            </div>

            <div>
              <label className={labelClassName} htmlFor="auctionName">
                Auction name <span className="text-rose-700">*</span>
              </label>
              <input
                autoComplete="off"
                className={fieldClassName}
                id="auctionName"
                name="auctionName"
                onChange={(event) =>
                  updateAuctionSetting("name", event.target.value)
                }
                placeholder="For example, New Horizons Annual Auction"
                required
                value={auctionSettings.name}
              />
            </div>

            <fieldset className="space-y-5">
              <legend className={labelClassName}>Bidding schedule</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClassName} htmlFor="biddingStartsAt">
                    Bidding starts <span className="text-rose-700">*</span>
                  </label>
                  <input
                    aria-describedby={
                      biddingStartError
                        ? "bidding-start-error"
                        : "bidding-start-hint"
                    }
                    aria-invalid={Boolean(biddingStartError)}
                    className={fieldClassName}
                    id="biddingStartsAt"
                    name="biddingStartsAtEastern"
                    onChange={(event) =>
                      updateAuctionSetting(
                        "biddingStartsAtEastern",
                        event.target.value,
                      )
                    }
                    ref={biddingStartInput}
                    required
                    step="60"
                    type="datetime-local"
                    value={auctionSettings.biddingStartsAtEastern}
                  />
                  {biddingStartError ? (
                    <p
                      className="mt-2 text-sm text-rose-800"
                      id="bidding-start-error"
                      role="alert"
                    >
                      {biddingStartError}
                    </p>
                  ) : (
                    <p
                      className="mt-2 text-sm leading-6 text-stone-700"
                      id="bidding-start-hint"
                    >
                      {biddingStartsAtUtc
                        ? "Start date and time look good."
                        : "Choose the confirmed start date and time."}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClassName} htmlFor="biddingEndsAt">
                    Bidding ends <span className="text-rose-700">*</span>
                  </label>
                  <input
                    aria-describedby={
                      biddingEndError ? "bidding-end-error" : "bidding-end-hint"
                    }
                    aria-invalid={Boolean(biddingEndError)}
                    className={fieldClassName}
                    id="biddingEndsAt"
                    min={auctionSettings.biddingStartsAtEastern || undefined}
                    name="biddingEndsAtEastern"
                    onChange={(event) =>
                      updateAuctionSetting(
                        "biddingEndsAtEastern",
                        event.target.value,
                      )
                    }
                    ref={biddingEndInput}
                    required
                    step="60"
                    type="datetime-local"
                    value={auctionSettings.biddingEndsAtEastern}
                  />
                  {biddingEndError ? (
                    <p
                      className="mt-2 text-sm text-rose-800"
                      id="bidding-end-error"
                      role="alert"
                    >
                      {biddingEndError}
                    </p>
                  ) : (
                    <p
                      className="mt-2 text-sm leading-6 text-stone-700"
                      id="bidding-end-hint"
                    >
                      {biddingEndsAtUtc
                        ? "End date and time look good."
                        : "Choose the confirmed end date and time."}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className={labelClassName} htmlFor="retailValue">
                Retail value ($) <span className="text-rose-700">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-stone-500">
                  $
                </span>
                <input
                  className={`${fieldClassName} pl-8`}
                  id="retailValue"
                  inputMode="decimal"
                  min="0"
                  name="retailValue"
                  onChange={(event) =>
                    updateField("retailValue", event.target.value)
                  }
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                  value={item.retailValue}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                The estimated value of the donated item.
              </p>
            </div>

            <div>
              <label className={labelClassName} htmlFor="startingBid">
                Starting bid ($) <span className="text-rose-700">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-stone-500">
                  $
                </span>
                <input
                  className={`${fieldClassName} pl-8`}
                  id="startingBid"
                  inputMode="decimal"
                  min="0"
                  name="startingBid"
                  onChange={(event) =>
                    updateField("startingBid", event.target.value)
                  }
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                  value={item.startingBid}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                The lowest amount someone can bid to get started.
              </p>
            </div>

            <div>
              <label className={labelClassName} htmlFor="bidIncrement">
                Bid increment ($) <span className="text-rose-700">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-stone-500">
                  $
                </span>
                <input
                  className={`${fieldClassName} pl-8`}
                  id="bidIncrement"
                  inputMode="decimal"
                  min="0.01"
                  name="bidIncrement"
                  onChange={(event) =>
                    updateField("bidIncrement", event.target.value)
                  }
                  placeholder="25.00"
                  required
                  step="0.01"
                  type="number"
                  value={item.bidIncrement}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                How much each new bid must increase.
              </p>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-stone-200 bg-stone-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p
            className="max-w-lg text-sm leading-5 text-stone-600"
            id="save-notice"
          >
            You can preview your item here. Saving will be available once admin
            access is set up.
          </p>
          <button
            aria-describedby="save-notice"
            className="inline-flex min-h-11 shrink-0 cursor-not-allowed items-center justify-center rounded-lg bg-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-800"
            disabled
            type="submit"
          >
            Save item
          </button>
        </footer>
      </form>
    </div>
  );
}
