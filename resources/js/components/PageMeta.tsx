type Pagedata = {
  title: string;
};
const PageMeta = ({ title }: Pagedata) => {
  return (
    <title>
      {title
        ? `${title} | Amanah Support - Asset Management System for Amanah insurance`
        : ' Amanah Support - Asset Management System for Amanah insurance'}
    </title>
  );
};

export default PageMeta;
