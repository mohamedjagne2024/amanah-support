type Pagedata = {
  title: string;
};
const PageMeta = ({ title }: Pagedata) => {
  return (
    <title>
      {title
        ? `${title} | Amanah Support Management`
        : ' Amanah Support Management'}
    </title>
  );
};

export default PageMeta;
