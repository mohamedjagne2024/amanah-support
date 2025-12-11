import {
  Box,
  Center,
  Container,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Head, router } from "@inertiajs/react";
import { Fragment, ReactNode } from "react";
import {
  LuBan,
  LuFileQuestion,
  LuServer,
  LuShieldAlert,
} from "react-icons/lu";
import { Button } from "~/components/ui/button";
import { Card } from "@chakra-ui/react";
import { AlertCircle, Home } from "lucide-react";

interface ErrorPageProps {
  status: number;
}

const getErrorDetails = (status: number) => {
  switch (status) {
    case 400:
      return {
        title: "400: Bad Request",
        description: "The request you made was invalid. Please check your input and try again.",
        icon: AlertCircle,
        colorPalette: "orange",
      };
    case 403:
      return {
        title: "403: Forbidden",
        description: "Sorry, you don't have permission to access this resource.",
        icon: LuShieldAlert,
        colorPalette: "red",
      };
    case 404:
      return {
        title: "404: Page Not Found",
        description: "Sorry, the page you are looking for could not be found.",
        icon: LuFileQuestion,
        colorPalette: "blue",
      };
    case 419:
      return {
        title: "419: Page Expired",
        description: "The page expired, please try again.",
        icon: LuBan,
        colorPalette: "yellow",
      };
    case 500:
      return {
        title: "500: Server Error",
        description: "Whoops, something went wrong on our servers. Please try again later.",
        icon: LuServer,
        colorPalette: "red",
      };
    case 503:
      return {
        title: "503: Service Unavailable",
        description: "Sorry, we are doing some maintenance. Please check back soon.",
        icon: LuServer,
        colorPalette: "orange",
      };
    default:
      return {
        title: `${status}: Error`,
        description: "An error occurred. Please try again later.",
        icon: AlertCircle,
        colorPalette: "gray",
      };
  }
};

function Page({ status }: ErrorPageProps) {
  const errorDetails = getErrorDetails(status);
  const IconComponent = errorDetails.icon;

  return (
    <Center minH="100vh" bg="gray.50">
      <Head>
        <title>{errorDetails.title}</title>
      </Head>

      <Container maxWidth="md">
        <Card.Root>
          <Card.Body>
            <VStack gap="6" align="center" textAlign="center" py="8">
              <Box
                p="6"
                borderRadius="full"
                bg={`${errorDetails.colorPalette}.subtle`}
                color={`${errorDetails.colorPalette}.fg`}
              >
                <Icon fontSize="6xl">
                  <IconComponent />
                </Icon>
              </Box>

              <Stack gap="2">
                <Heading size="2xl" color={`${errorDetails.colorPalette}.600`}>
                  {errorDetails.title}
                </Heading>
                <Text fontSize="lg" color="fg.muted" maxWidth="md">
                  {errorDetails.description}
                </Text>
              </Stack>

              <HStack gap="4" mt="4">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Container>
    </Center>
  );
}

Page.layout = (page: ReactNode) => <Fragment>{page}</Fragment>;

export default Page;

