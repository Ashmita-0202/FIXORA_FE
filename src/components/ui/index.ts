/**
 * Barrel for the shadcn primitive layer.
 *
 * Feature code imports from "@/components/ui" rather than reaching into
 * individual files, so the primitive set can be swapped without touching pages.
 */
export { Alert, AlertDescription, AlertTitle } from "./alert";
export { Avatar, AvatarFallback, AvatarImage } from "./avatar";
export { Badge, badgeVariants } from "./badge";
export { Button, buttonVariants } from "./button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
export { Input, Textarea } from "./input";
export { Label } from "./label";
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "./select";
export { Separator } from "./separator";
export { Skeleton } from "./skeleton";
export { Switch } from "./switch";
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";