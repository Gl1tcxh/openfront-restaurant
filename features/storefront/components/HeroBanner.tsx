"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { StorefrontSectionLink } from "@/features/storefront/components/StorefrontSectionLink"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { getMenuItemHref } from "@/features/storefront/lib/menu-item-utils"
import { type StoreInfo } from "@/features/storefront/lib/store-data"

type HeroItem = {
  id: string
  name: string
  description: string
  imagePath?: string | null
  price: number | string
  categoryName?: string
}

interface HeroBannerProps {
  menuHref: string
  popularHref?: string
  storeInfo: StoreInfo
  heroItems: HeroItem[]
}

function HeroImage({
  item,
  priority = false,
  imageClassName = "object-contain",
}: {
  item: HeroItem
  priority?: boolean
  imageClassName?: string
}) {
  if (!item.imagePath) {
    return (
      <div className="flex size-full items-center justify-center p-8 text-center">
        <div>
          <p className="font-serif text-2xl font-semibold text-foreground">{item.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">Fresh from the kitchen.</p>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={item.imagePath}
      alt={item.name}
      fill
      priority={priority}
      className={imageClassName}
      sizes="(max-width: 1024px) 100vw, 40vw"
    />
  )
}

function HeroThumbFrame({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 161 92"
      fill="none"
      className={`absolute bottom-0 left-1/2 h-[5.75rem] w-[10rem] -translate-x-1/2 ${
        active ? "text-primary" : "text-border"
      }`}
      aria-hidden="true"
    >
      <path
        d="M0.682517 80.6118L0.501193 39.6946C0.480127 34.9409 3.80852 30.8294 8.46241 29.8603L148.426 0.713985C154.636 -0.579105 160.465 4.16121 160.465 10.504V80.7397C160.465 86.2674 155.98 90.7465 150.453 90.7397L10.6701 90.5674C5.16936 90.5607 0.706893 86.1125 0.682517 80.6118Z"
        stroke="currentColor"
      />
    </svg>
  )
}

export function HeroBanner({ menuHref, storeInfo, heroItems }: HeroBannerProps) {
  const [mainApi, setMainApi] = useState<CarouselApi>()
  const [thumbApi, setThumbApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const slides = useMemo(() => heroItems.slice(0, 6), [heroItems])
  const activeItem = slides[current] || slides[0]

  useEffect(() => {
    if (!mainApi) return

    const onSelect = () => {
      const nextIndex = mainApi.selectedScrollSnap()
      setCurrent(nextIndex)
      thumbApi?.scrollTo(nextIndex)
    }

    onSelect()
    mainApi.on("select", onSelect)
    mainApi.on("reInit", onSelect)

    return () => {
      mainApi.off("select", onSelect)
    }
  }, [mainApi, thumbApi])

  useEffect(() => {
    if (!thumbApi) return

    const onSelect = () => {
      setCurrent(thumbApi.selectedScrollSnap())
    }

    thumbApi.on("select", onSelect)
    return () => {
      thumbApi.off("select", onSelect)
    }
  }, [thumbApi])

  return (
    <section
      id="home"
      className="relative flex-1 py-12 before:absolute before:inset-0 before:-z-10 before:-skew-y-3 before:border-b before:border-primary/12 before:bg-muted/40 sm:py-16 lg:py-24"
    >
      <div className="storefront-shell flex flex-col gap-12 lg:gap-16">
        <div className="grid grid-cols-1 gap-10 md:gap-y-14 lg:grid-cols-5 lg:gap-x-12">
          <div className="flex w-full flex-col justify-center gap-5 lg:col-span-3 lg:min-h-[34rem]">
            <h1 className="max-w-4xl text-balance font-serif text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              {storeInfo.heroHeadline || storeInfo.name}
            </h1>

            <p className="max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              {storeInfo.heroSubheadline || storeInfo.tagline}
            </p>

            <div className="flex items-center gap-3.5 pt-1">
              <StorefrontSectionLink
                href={menuHref}
                prefetch={false}
                className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Order now
                <ArrowRight className="size-4" />
              </StorefrontSectionLink>
            </div>
          </div>

          <Carousel
            className="w-full lg:col-span-2"
            setApi={setMainApi}
            opts={{ loop: slides.length > 1 }}
          >
            <CarouselContent>
              {slides.map((item, index) => (
                <CarouselItem key={item.id} className="flex w-full items-center justify-center">
                  <Link
                    href={getMenuItemHref(item.id)}
                    prefetch={false}
                    className="block w-full"
                  >
                    <div className="rounded-[2.5rem] bg-background p-4 ring-1 ring-border/40 sm:rounded-[2.75rem] sm:p-5 lg:rounded-[3rem] lg:p-6">
                      <div className="relative min-h-[18rem] w-full overflow-hidden rounded-[1.6rem] bg-muted/35 sm:min-h-[24rem] sm:rounded-[1.9rem] lg:min-h-[34rem] lg:rounded-[2.2rem]">
                        <HeroImage
                          item={item}
                          priority={index === 0}
                          imageClassName="object-cover"
                        />
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {slides.length > 1 ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-x-12">
            <div className="space-y-4 lg:col-span-3">
              <Carousel
                className="relative w-full"
                setApi={setThumbApi}
                opts={{ loop: false, align: "start" }}
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-background via-background/85 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-background via-background/85 to-transparent" />
                <CarouselContent className="-ml-4 flex">
                  {slides.map((item, index) => (
                    <CarouselItem
                      key={item.id}
                      className="basis-1/2 pl-4 sm:basis-1/3 lg:basis-1/3 xl:basis-1/4"
                    >
                      <button
                        type="button"
                        onClick={() => mainApi?.scrollTo(index)}
                        aria-label={`Show ${item.name}`}
                        className="group relative flex h-32 w-full items-center justify-center bg-background p-4"
                      >
                        <HeroThumbFrame active={current === index} />
                        <div className="relative z-10 size-24 overflow-hidden rounded-[1.1rem] bg-background ring-1 ring-border/35 transition-transform duration-200 group-hover:scale-[1.02] sm:size-28 sm:rounded-[1.35rem]">
                          <HeroImage item={item} imageClassName="object-cover" />
                        </div>
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => mainApi?.scrollPrev()}
                  aria-label="Previous hero item"
                  className="inline-flex size-11 items-center justify-center border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mainApi?.scrollNext()}
                  aria-label="Next hero item"
                  className="inline-flex size-11 items-center justify-center border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>

            {activeItem ? (
              <div className="flex items-center lg:col-span-2">
                <div className="space-y-3">
                  {activeItem.categoryName ? (
                    <p className="text-sm font-medium text-primary">{activeItem.categoryName}</p>
                  ) : null}
                  <Link href={getMenuItemHref(activeItem.id)} prefetch={false} className="block">
                    <h2 className="font-serif text-2xl font-semibold text-foreground transition-colors hover:text-primary">
                      {activeItem.name}
                    </h2>
                  </Link>
                  <p className="max-w-xl text-pretty text-base leading-7 text-foreground/80">
                    {activeItem.description || "Freshly prepared to order."}
                  </p>
                  <p className="text-lg font-medium tabular-nums text-foreground">
                    {formatCurrency(activeItem.price, {
                      currencyCode: storeInfo.currencyCode,
                      locale: storeInfo.locale,
                    })}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
