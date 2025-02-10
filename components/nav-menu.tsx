import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";

export function Nav({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("flex justify-center p-2 gap-6 bg-grey-600", className)}
      {...props}
    >
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Dashboard</NavigationMenuTrigger>
            <NavigationMenuContent className="m-1">
              <NavigationMenuLink href="/dashboard/overview">
                Overview
              </NavigationMenuLink>
              <NavigationMenuLink href="/dashboard/stats">
                Statistics
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Settings</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/settings/profile">
                Profile
              </NavigationMenuLink>
              <NavigationMenuLink href="/settings/preferences">
                Preferences
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/docs/intro">
                Introduction
              </NavigationMenuLink>
              <NavigationMenuLink href="/docs/installation">
                Installation
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Help</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/help/faqs">FAQs</NavigationMenuLink>
              <NavigationMenuLink href="/help/contact">
                Contact Us
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
